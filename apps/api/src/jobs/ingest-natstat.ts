import { loadForecasts } from '../integrators/natstat/client.js'
import { normalizeForecasts, adjustSpreadSigns } from '../integrators/natstat/normalize.js'
import { prisma } from '@pulse/db'

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
      // 1) Load forecasts from unified endpoint
      const forecastsRaw = await loadForecasts({ league: natstatLeague, date: currentDate })

      // 2) Normalize the response with team code to name mapping
      let events = normalizeForecasts(forecastsRaw, league, teamCodeToName)

      // 3) Adjust spread signs based on favorite team
      events = adjustSpreadSigns(events, teamIdToCode)
      totalEvents += events.length

      // 3) Upsert into DB
      for (const ev of events) {
        // minimal validation
        if (!ev.homeTeam || !ev.awayTeam || !ev.startsAt) {
          continue
        }

        // Find or create game by unique fields
        const gameWhere = {
          league: ev.league ?? 'unknown',
          startsAt: new Date(ev.startsAt),
          homeTeam: ev.homeTeam,
          awayTeam: ev.awayTeam,
        }

        let game = await prisma.game.findFirst({ where: gameWhere })
        let scoresUpdated = false

        if (!game) {
          game = await prisma.game.create({
            data: {
              ...gameWhere,
              status: ev.status ?? 'scheduled',
            },
          })
        } else {
          // Update game status and start time if changed
          const updates: Record<string, unknown> = {}

          if (ev.status && ev.status !== game.status) {
            updates.status = ev.status
          }

          if (ev.startsAt && new Date(ev.startsAt).getTime() !== game.startsAt.getTime()) {
            updates.startsAt = new Date(ev.startsAt)
          }

          if (Object.keys(updates).length > 0) {
            await prisma.game.update({
              where: { id: game.id },
              data: updates,
            })
          }

          // Update scores if they exist and game is finished
          if (ev.homeScore !== undefined && ev.awayScore !== undefined) {
            const existingResult = await prisma.result.findUnique({
              where: { gameId: game.id },
            })

            if (!existingResult) {
              await prisma.result.create({
                data: {
                  gameId: game.id,
                  homeScore: ev.homeScore,
                  awayScore: ev.awayScore,
                },
              })
              scoresUpdated = true
            } else if (existingResult.homeScore !== ev.homeScore || existingResult.awayScore !== ev.awayScore) {
              await prisma.result.update({
                where: { gameId: game.id },
                data: {
                  homeScore: ev.homeScore,
                  awayScore: ev.awayScore,
                },
              })
              scoresUpdated = true
            }
          }
        }

        // Upsert odds lines
        let oddsUpserted = 0
        for (const line of ev.lines) {
          const provider = 'natstat'
          const book = line.book ?? 'natstat'
          const market = line.market ?? 'moneyline'

          // Build the update data object, only including non-null values
          const updateData: Record<string, unknown> = {
            provider,
            updatedAt: line.updatedAt ? new Date(line.updatedAt) : new Date(),
          }

          // Add market-specific fields
          if (market === 'moneyline') {
            if (line.moneylineHome !== undefined) updateData.moneylineHome = line.moneylineHome
            if (line.moneylineAway !== undefined) updateData.moneylineAway = line.moneylineAway
          } else if (market === 'pointspread') {
            if (line.spread !== undefined) updateData.spread = line.spread
          } else if (market === 'overunder') {
            if (line.total !== undefined) updateData.total = line.total
          }

          // Use Prisma upsert keyed by the composite unique ([gameId, book, market])
          await prisma.gameOdds.upsert({
            where: { gameId_book_market: { gameId: game.id, book, market } },
            update: updateData,
            create: {
              gameId: game.id,
              provider,
              book,
              market,
              moneylineHome: line.moneylineHome ?? null,
              moneylineAway: line.moneylineAway ?? null,
              spread: line.spread ?? null,
              total: line.total ?? null,
            },
          })

          oddsUpserted++
        }

        allResults.push({
          identity: ev.identity,
          gameId: game.id,
          oddsUpserted,
          scoresUpdated,
        })
      }
    } catch (error) {
      // Log error but continue with other dates
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[ingest-natstat] Error processing date ${currentDate}:`, message)
      // Continue to next date
    }
  }

  return {
    ok: true,
    counts: {
      datesProcessed: dates.length,
      events: totalEvents,
      games: allResults.length,
      oddsLines: allResults.reduce((sum, r) => sum + r.oddsUpserted, 0),
      scoresUpdated: allResults.filter((r) => r.scoresUpdated).length,
    },
    details: allResults,
  }
}
