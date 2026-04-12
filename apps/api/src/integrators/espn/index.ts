/**
 * ESPN Teams API integrator - main exports
 */

import { createLogger } from '../../lib/logger.js'
import { fetchTeams } from './client.js'
import { extractLogoUrlDark, extractLogoUrlLight } from './logo-urls.js'
import type { ESPNTeam } from './types.js'

const logger = createLogger('ESPN')

/**
 * Get all teams for a league from ESPN
 * @param league - League code (e.g., 'NBA', 'NFL', 'MLB', 'NHL')
 * @returns Array of ESPN teams with logos and metadata
 */
export async function getTeamsForLeague(league: string): Promise<ESPNTeam[]> {
  const response = await fetchTeams({ league })

  // ESPN response is nested: sports[0].leagues[0].teams[]
  const sport = response.sports?.[0]
  if (!sport) {
    logger.warn('No sports found in ESPN response', { league })
    return []
  }

  const leagueData = sport.leagues?.[0]
  if (!leagueData) {
    logger.warn('No leagues found in ESPN response', { league })
    return []
  }

  const teams = leagueData.teams?.map((t) => t.team) ?? []

  logger.info('Fetched teams from ESPN', { league, count: teams.length })

  return teams
}

/**
 * Find a specific team by name or abbreviation within a league
 * Case-insensitive matching
 *
 * @param league - League code (e.g., 'NBA', 'NFL', 'MLB', 'NHL')
 * @param teamIdentifier - Team name, abbreviation, or location to search for
 * @returns ESPN team data or null if not found
 */
export async function findTeamInLeague(league: string, teamIdentifier: string): Promise<ESPNTeam | null> {
  const teams = await getTeamsForLeague(league)

  const normalized = teamIdentifier.toLowerCase().trim()

  const team = teams.find((t) => {
    const displayName = t.displayName.toLowerCase()
    const shortName = t.shortDisplayName.toLowerCase()
    const abbr = t.abbreviation.toLowerCase()
    const location = t.location.toLowerCase()
    const name = t.name.toLowerCase()

    return (
      displayName === normalized ||
      shortName === normalized ||
      abbr === normalized ||
      location === normalized ||
      name === normalized ||
      displayName.includes(normalized) ||
      normalized.includes(displayName)
    )
  })

  if (!team) {
    logger.warn('Team not found in ESPN', { league, teamIdentifier })
    return null
  }

  logger.debug('Found team in ESPN', {
    league,
    teamIdentifier,
    foundTeam: team.displayName,
    hasLogos: !!team.logos && team.logos.length > 0,
  })

  return team
}

export { extractLogoUrlDark, extractLogoUrlLight }

/**
 * @deprecated Use {@link extractLogoUrlLight} — kept for older call sites.
 */
export function extractPrimaryLogo(team: ESPNTeam): string | null {
  return extractLogoUrlLight(team)
}

/**
 * @deprecated Use {@link extractLogoUrlDark} — kept for older call sites.
 */
export function extractAlternateLogo(team: ESPNTeam): string | null {
  return extractLogoUrlDark(team)
}

// Re-export types
export type { ESPNTeam, ESPNTeamLogo, ESPNTeamsResponse } from './types.js'
