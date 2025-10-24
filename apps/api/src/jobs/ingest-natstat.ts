import { loadForecasts } from '../integrators/natstat/client.js'
import { normalizeForecasts, adjustSpreadSigns } from '../integrators/natstat/normalize.js'
import { prisma } from '@pulse/db'
import { gamesService } from '../services/games.service.js'
import { oddsService } from '../services/odds.service.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('IngestNatStat')

type JobInput = { date?: string; league?: string }

/**
 * Ingest odds and game data from NatStat's unified /forecasts endpoint.
 * This endpoint provides moneyline, spread, and over/under all in one call.
 *
 * @param date - Optional date in YYYY-MM-DD format or date range "YYYY-MM-DD,YYYY-MM-DD"
 * @param league - Required league code (NFL, NBA, MLB, NHL)
 */
export async function ingestNatStat({ date, league }: JobInput) {
  if (!league) {
    throw new Error('League is required for NatStat forecasts ingestion')
  }

  logger.info('Starting NatStat ingestion job', { date: date ?? 'today', league })

  // Map common league names to NatStat codes
  const leagueMap: Record<string, string> = {
    NFL: 'pfb',
    NBA: 'nba',
    MLB: 'mlb',
    NHL: 'nhl',
  }

  const natstatLeague = leagueMap[league.toUpperCase()] ?? league.toLowerCase()
  const normalizedLeague = league.toUpperCase()

  // Load team data from database
  // This is used for:
  // 1. Mapping team codes to full team names for normalization
  // 2. Mapping team IDs to codes for spread adjustments
  const teams = await prisma.natStatTeam.findMany({
    where: { league: normalizedLeague },
    select: { id: true, code: true, name: true },
  })

  logger.debug('Loaded team mappings', { league: normalizedLeague, teamCount: teams.length })

  const teamIdToCode = new Map(teams.map((t) => [t.id, t.code]))
  const teamCodeToName = new Map(teams.map((t) => [t.code, t.name]))

  // Parse date parameter - can be single date or range "start,end"
  const dates: string[] = []

  if (date) {
    if (date.includes(',')) {
      // Date range: "2025-10-19,2025-10-26"
      const [start, end] = date.split(',').map((d) => d.trim())
      const startDate = new Date(start)
      const endDate = new Date(end)

      // Generate all dates in range
      const current = new Date(startDate)
      while (current <= endDate) {
        dates.push(current.toISOString().slice(0, 10))
        current.setDate(current.getDate() + 1)
      }
    } else {
      // Single date
      dates.push(date)
    }
  } else {
    // Default to today
    dates.push(new Date().toISOString().slice(0, 10))
  }

  const allResults: { identity: string; gameId?: string; oddsUpserted: number; scoresUpdated: boolean }[] = []
  let totalEvents = 0

  // Process each date
  for (const currentDate of dates) {
    try {
      logger.debug('Processing date', { date: currentDate, league: natstatLeague })

      // 1) Load forecasts from unified endpoint
      const forecastsRaw = await loadForecasts({ league: natstatLeague, date: currentDate })

      // 2) Normalize the response with team code to name mapping
      let events = normalizeForecasts(forecastsRaw, league, teamCodeToName)

      // 3) Adjust spread signs based on favorite team
      events = adjustSpreadSigns(events, teamIdToCode)
      totalEvents += events.length

      logger.info('Normalized events', { date: currentDate, eventCount: events.length })

      // 3) Upsert into DB
      for (const ev of events) {
        // minimal validation
        if (!ev.homeTeam || !ev.awayTeam || !ev.startsAt) {
          continue
        }

        // Find or create game
        const game = await gamesService.findOrCreateGame({
          league: ev.league ?? 'unknown',
          startsAt: new Date(ev.startsAt),
          homeTeam: ev.homeTeam,
          awayTeam: ev.awayTeam,
          status: ev.status ?? 'scheduled',
        })

        // Update game metadata (status, start time) if changed
        await gamesService.updateGameMetadata(
          game.id,
          { status: game.status, startsAt: game.startsAt },
          {
            status: ev.status,
            startsAt: ev.startsAt ? new Date(ev.startsAt) : undefined,
          }
        )

        // Update scores if provided
        let scoresUpdated = false
        if (ev.homeScore !== undefined && ev.awayScore !== undefined) {
          scoresUpdated = await gamesService.upsertGameScores(game.id, {
            homeScore: ev.homeScore,
            awayScore: ev.awayScore,
          })
        }

        // Upsert odds lines
        const oddsUpserted = await oddsService.upsertOddsLines(
          ev.lines.map((line) => ({
            gameId: game.id,
            provider: 'natstat',
            book: line.book ?? 'natstat',
            market: (line.market ?? 'moneyline') as 'moneyline' | 'pointspread' | 'overunder',
            moneylineHome: line.moneylineHome,
            moneylineAway: line.moneylineAway,
            spread: line.spread,
            total: line.total,
            updatedAt: line.updatedAt ? new Date(line.updatedAt) : undefined,
          }))
        )

        allResults.push({
          identity: ev.identity,
          gameId: game.id,
          oddsUpserted,
          scoresUpdated,
        })
      }
    } catch (error) {
      // Log error but continue with other dates
      logger.error('Error processing date', error instanceof Error ? error : undefined, { date: currentDate, league })
      // Continue to next date
    }
  }

  const counts = {
    datesProcessed: dates.length,
    events: totalEvents,
    games: allResults.length,
    oddsLines: allResults.reduce((sum, r) => sum + r.oddsUpserted, 0),
    scoresUpdated: allResults.filter((r) => r.scoresUpdated).length,
  }

  logger.info('NatStat ingestion job completed', { league, ...counts })

  return {
    ok: true,
    counts,
    details: allResults,
  }
}
