import { prisma } from '@/lib/db'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('TeamsService')

/**
 * Team metadata with logo URLs
 */
export interface TeamMetadata {
  id: string
  name: string
  code: string
  league: string
  badgeUrl: string | null
  logoUrl: string | null
}

/**
 * Find team by name or code within a league
 * Uses fuzzy matching to handle variations in team names
 */
export async function findTeamByName(league: string, teamName: string): Promise<TeamMetadata | null> {
  if (!teamName || !league) {
    return null
  }

  const normalizedLeague = league.toUpperCase()
  const normalizedName = teamName.toLowerCase().trim()

  // Try exact match first
  const exactMatch = await prisma.natStatTeam.findFirst({
    where: {
      league: normalizedLeague,
      OR: [{ name: { equals: teamName, mode: 'insensitive' } }, { code: { equals: teamName, mode: 'insensitive' } }],
    },
  })

  if (exactMatch) {
    logger.debug('Found team by exact match', { league, teamName, foundTeam: exactMatch.name })
    return exactMatch
  }

  // Try partial match (case-insensitive contains)
  const partialMatch = await prisma.natStatTeam.findFirst({
    where: {
      league: normalizedLeague,
      OR: [
        { name: { contains: teamName, mode: 'insensitive' } },
        { code: { contains: teamName, mode: 'insensitive' } },
      ],
    },
  })

  if (partialMatch) {
    logger.debug('Found team by partial match', { league, teamName, foundTeam: partialMatch.name })
    return partialMatch
  }

  // Try reverse match (team name contains the search term)
  // This helps when game has "Dallas Cowboys" but we search for just "Cowboys"
  const allTeams = await prisma.natStatTeam.findMany({
    where: { league: normalizedLeague },
  })

  const fuzzyMatch = allTeams.find((team) => {
    const teamNameLower = team.name.toLowerCase()
    const teamCodeLower = team.code.toLowerCase()

    // Check if either the team name or code contains the search term
    // or if the search term contains the team code (for abbreviations)
    return (
      teamNameLower.includes(normalizedName) ||
      teamCodeLower.includes(normalizedName) ||
      normalizedName.includes(teamCodeLower)
    )
  })

  if (fuzzyMatch) {
    logger.debug('Found team by fuzzy match', { league, teamName, foundTeam: fuzzyMatch.name })
    return fuzzyMatch
  }

  logger.warn('Team not found', { league, teamName })
  return null
}

/**
 * Get all teams for a league
 */
export async function getTeamsByLeague(league: string): Promise<TeamMetadata[]> {
  const normalizedLeague = league.toUpperCase()

  const teams = await prisma.natStatTeam.findMany({
    where: { league: normalizedLeague, active: true },
    orderBy: { name: 'asc' },
  })

  logger.debug('Fetched teams for league', { league, count: teams.length })
  return teams
}

/**
 * Cache for team lookups to avoid repeated database queries
 */
const teamCache = new Map<string, TeamMetadata | null>()

/**
 * Get team with caching
 */
export async function getTeamMetadata(league: string, teamName: string): Promise<TeamMetadata | null> {
  const cacheKey = `${league}:${teamName}`.toLowerCase()

  if (teamCache.has(cacheKey)) {
    return teamCache.get(cacheKey) ?? null
  }

  const team = await findTeamByName(league, teamName)
  teamCache.set(cacheKey, team)

  // Clear cache after 5 minutes to allow for updates
  setTimeout(() => teamCache.delete(cacheKey), 5 * 60 * 1000)

  return team
}
