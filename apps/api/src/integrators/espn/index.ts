/**
 * ESPN Teams API integrator - main exports
 */

import { createLogger } from '../../lib/logger.js'
import { fetchTeams } from './client.js'
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

/**
 * Extract the primary logo URL from an ESPN team
 * Prefers the largest "full" or "default" logo
 *
 * @param team - ESPN team object
 * @returns Logo URL or null if not available
 */
export function extractPrimaryLogo(team: ESPNTeam): string | null {
  if (!team.logos || team.logos.length === 0) {
    return null
  }

  // Prefer logos with "full" or "default" rel
  const fullLogo = team.logos.find((logo) => logo.rel.includes('full') || logo.rel.includes('default'))

  if (fullLogo) {
    return fullLogo.href
  }

  // Fallback to first logo
  return team.logos[0]?.href ?? null
}

/**
 * Extract alternate/dark logo URL from an ESPN team
 *
 * @param team - ESPN team object
 * @returns Alternate logo URL or null if not available
 */
export function extractAlternateLogo(team: ESPNTeam): string | null {
  if (!team.logos || team.logos.length === 0) {
    return null
  }

  // Look for dark/alternate logos
  const altLogo = team.logos.find((logo) => logo.rel.includes('dark') || logo.rel.includes('alternate'))

  if (altLogo) {
    return altLogo.href
  }

  // If we have multiple logos, use the second one as alternate
  if (team.logos.length > 1) {
    return team.logos[1].href
  }

  return null
}

// Re-export types
export type { ESPNTeam, ESPNTeamLogo, ESPNTeamsResponse } from './types.js'
