import { loadTeams } from '../integrators/natstat/client.js'
import { getTeamsForLeague, extractPrimaryLogo, extractAlternateLogo } from '../integrators/espn/index.js'
import type { ESPNTeam } from '../integrators/espn/types.js'
import { prisma } from '@/lib/db'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('SyncNatStatTeams')

type JobInput = { league: string }

type NatStatTeamRecord = {
  id: string
  code: string
  name: string
  active: boolean
}

type NatStatApiEnvelope = Record<string, unknown>
type NatStatApiNode = Record<string, unknown>

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function readRecord(value: unknown): NatStatApiNode | undefined {
  return value && typeof value === 'object' ? (value as NatStatApiNode) : undefined
}

function readSeasonCode(raw: NatStatApiEnvelope): string | undefined {
  const query = readRecord(raw.query)
  const context = readRecord(query?.context)
  const season = readRecord(context?.season)
  return readString(season?.season_0)
}

function readCompetitionNode(teamData: NatStatApiNode, preferredSeason?: string) {
  const seasonKeys = Object.keys(teamData ?? {}).filter((key) => /^season_\d{4}$/.test(key))

  seasonKeys.sort((left, right) => {
    if (preferredSeason) {
      const preferredKey = `season_${preferredSeason}`
      if (left === preferredKey) return -1
      if (right === preferredKey) return 1
    }

    return right.localeCompare(left)
  })

  for (const seasonKey of seasonKeys) {
    const seasonNode = teamData?.[seasonKey]
    if (!seasonNode || typeof seasonNode !== 'object') continue

    const competitionEntries = Object.entries(seasonNode).filter(([key]) => key.startsWith('competition_'))
    for (const [, competition] of competitionEntries) {
      if (!competition || typeof competition !== 'object') continue

      const code = readString((competition as { code?: unknown }).code)
      const name = readString((competition as { name?: unknown }).name)

      if (code || name) {
        return {
          seasonKey,
          competition: competition as Record<string, unknown>,
        }
      }
    }
  }

  return null
}

function buildTeamRecord(
  teamKey: string,
  teamData: NatStatApiNode,
  preferredSeason?: string,
): NatStatTeamRecord | null {
  const teamId = teamKey.replace('team_', '')
  const active = readString(teamData?.active) === 'Y'
  const competitionNode = readCompetitionNode(teamData, preferredSeason)
  const competition = competitionNode?.competition

  const code = readString(competition?.code)
  const name = readString(competition?.name) ?? readString(teamData?.name)

  if (!teamId || !code || !name) {
    return null
  }

  return {
    id: teamId,
    code,
    name,
    active,
  }
}

function choosePreferredRecord(left: NatStatTeamRecord, right: NatStatTeamRecord) {
  if (left.active !== right.active) {
    return left.active ? left : right
  }

  if (left.name.length !== right.name.length) {
    return left.name.length <= right.name.length ? left : right
  }

  return left.id <= right.id ? left : right
}

/**
 * Sync team metadata from NatStat's /teams endpoint to our database,
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

  // Load teams from NatStat v4.
  const teamsRaw = await loadTeams({ league: natstatLeague })

  const teamsNode = teamsRaw?.teams
  if (!teamsNode || typeof teamsNode !== 'object') {
    throw new Error('Invalid teams response from NatStat')
  }

  const preferredSeason = readSeasonCode(teamsRaw)

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
      error instanceof Error ? { message: error.message } : undefined,
    )
  }

  const teams = Object.entries(teamsNode as NatStatApiNode)
  const selectedTeams = new Map<string, NatStatTeamRecord>()
  let created = 0
  let updated = 0
  let skipped = 0
  let enriched = 0

  for (const [teamKey, teamData] of teams) {
    if (!teamData || typeof teamData !== 'object') {
      skipped++
      continue
    }

    const record = buildTeamRecord(teamKey, teamData as NatStatApiNode, preferredSeason)
    if (!record) {
      skipped++
      continue
    }

    const dedupeKey = record.code.toLowerCase()
    const existing = selectedTeams.get(dedupeKey)
    if (!existing) {
      selectedTeams.set(dedupeKey, record)
      continue
    }

    selectedTeams.set(dedupeKey, choosePreferredRecord(existing, record))
    skipped++
  }

  for (const { id: teamId, code, name, active } of selectedTeams.values()) {
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
    selected: selectedTeams.size,
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
      selected: selectedTeams.size,
      created,
      updated,
      skipped,
      enriched,
    },
  }
}
