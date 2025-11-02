import { loadTeamCodes } from '../integrators/natstat/client.js'
import { getTeamsForLeague, extractPrimaryLogo, extractAlternateLogo } from '../integrators/espn/index.js'
import type { ESPNTeam } from '../integrators/espn/types.js'
import { prisma } from '@pulse/db'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('SyncNatStatTeams')

type JobInput = { league: string }

/**
 * Sync team codes from NatStat's /teamcodes endpoint to our database,
 * enriched with badge and logo URLs from ESPN's public teams API.
 * This should be run periodically (e.g., weekly or monthly) to keep team data up-to-date.
 */
export async function syncNatStatTeams({ league }: JobInput) {
  if (!league) {
    throw new Error('League is required for NatStat team sync')
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

  logger.info('Starting team sync', { league: normalizedLeague, natstatLeague })

  // Load team codes from NatStat
  const teamCodesRaw = await loadTeamCodes({ league: natstatLeague })

  // Extract teamcodes map
  const teamcodes = teamCodesRaw?.teamcodes
  if (!teamcodes || typeof teamcodes !== 'object') {
    throw new Error('Invalid team codes response from NatStat')
  }

  // Load team metadata from ESPN
  let espnTeamsMap: Map<string, ESPNTeam> = new Map()
  try {
    logger.info('Fetching team metadata from ESPN', { league: normalizedLeague })
    const espnTeams = await getTeamsForLeague(normalizedLeague)

    if (espnTeams.length > 0) {
      // Create a map keyed by team abbreviation and normalized name for easier lookup
      for (const team of espnTeams) {
        // Store by abbreviation (most reliable)
        espnTeamsMap.set(team.abbreviation.toLowerCase(), team)

        // Also store by normalized display name
        const normalizedName = team.displayName.toLowerCase().replace(/\s+/g, '')
        espnTeamsMap.set(normalizedName, team)

        // Store by location
        const normalizedLocation = team.location.toLowerCase().replace(/\s+/g, '')
        espnTeamsMap.set(normalizedLocation, team)
      }
      logger.info('Successfully fetched ESPN team metadata', { count: espnTeams.length })
    } else {
      logger.warn('No teams returned from ESPN', { league: normalizedLeague })
    }
  } catch (error) {
    // Non-fatal: continue without ESPN enrichment
    logger.warn(
      'Failed to fetch ESPN metadata, continuing without enrichment',
      error instanceof Error ? { message: error.message } : undefined
    )
  }

  const teams = Object.entries(teamcodes)
  let created = 0
  let updated = 0
  let skipped = 0
  let enriched = 0

  for (const [teamKey, teamData] of teams) {
    // Extract team ID from key (e.g., "team_2022531" -> "2022531")
    const teamId = teamKey.replace('team_', '')
    const code = (teamData as { code?: string }).code
    const name = (teamData as { name?: string }).name
    const active = (teamData as { active?: string }).active === 'Y'

    if (!code || !name) {
      skipped++
      continue
    }

    // Try to find matching ESPN team
    // First try by code (most reliable), then by normalized name
    const normalizedCode = code.toLowerCase()
    const normalizedName = name.toLowerCase().replace(/\s+/g, '')

    const espnTeam = espnTeamsMap.get(normalizedCode) ?? espnTeamsMap.get(normalizedName)

    // Extract logo URLs from ESPN team
    const badgeUrl = espnTeam ? extractPrimaryLogo(espnTeam) : null
    const logoUrl = espnTeam ? extractAlternateLogo(espnTeam) : null

    if (espnTeam) {
      enriched++
      logger.debug('Enriched team with ESPN metadata', {
        teamName: name,
        badgeUrl,
        logoUrl,
      })
    }

    // Extract nickname from full name (e.g., "Los Angeles Lakers" -> "Lakers")
    const nameParts = name.split(' ')
    const nickname = nameParts[nameParts.length - 1] || name

    // Extract city (everything except the last word)
    const city = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : null

    // Create or update core Team record
    const team = await prisma.team.upsert({
      where: {
        league_code: {
          league: normalizedLeague,
          code,
        },
      },
      create: {
        league: normalizedLeague,
        code,
        name,
        city,
        nickname,
        logoUrl: logoUrl ?? undefined,
        primaryColor: null,
      },
      update: {
        name,
        city,
        nickname,
        logoUrl: logoUrl ?? undefined,
      },
    })

    // Create or update TeamProviderMapping for NatStat
    await prisma.teamProviderMapping.upsert({
      where: {
        teamId_provider: {
          teamId: team.id,
          provider: 'natstat',
        },
      },
      create: {
        teamId: team.id,
        provider: 'natstat',
        externalId: teamId,
        externalCode: code,
        externalName: name,
        active,
        metadata: badgeUrl ? { badgeUrl } : undefined,
      },
      update: {
        externalCode: code,
        externalName: name,
        active,
        metadata: badgeUrl ? { badgeUrl } : undefined,
      },
    })

    // Also update legacy NatStatTeam table for backwards compatibility
    const existing = await prisma.natStatTeam.findUnique({
      where: { id: teamId },
    })

    if (existing) {
      // Update if changed
      if (
        existing.code !== code ||
        existing.name !== name ||
        existing.active !== active ||
        existing.badgeUrl !== badgeUrl ||
        existing.logoUrl !== logoUrl
      ) {
        await prisma.natStatTeam.update({
          where: { id: teamId },
          data: {
            code,
            name,
            active,
            badgeUrl,
            logoUrl,
          },
        })
        updated++
      } else {
        skipped++
      }
    } else {
      // Create new
      await prisma.natStatTeam.create({
        data: {
          id: teamId,
          code,
          name,
          league: normalizedLeague,
          active,
          badgeUrl,
          logoUrl,
        },
      })
      created++
    }
  }

  logger.info('Team sync completed', {
    league: normalizedLeague,
    total: teams.length,
    created,
    updated,
    skipped,
    enriched,
  })

  return {
    ok: true,
    league: normalizedLeague,
    counts: {
      total: teams.length,
      created,
      updated,
      skipped,
      enriched,
    },
  }
}
