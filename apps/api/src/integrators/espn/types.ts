/**
 * ESPN API response types for teams endpoint
 * Endpoint pattern: https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams
 */

export interface ESPNTeamLogo {
  href: string
  width: number
  height: number
  alt: string
  rel: string[]
}

export interface ESPNTeam {
  id: string
  uid: string
  slug: string
  location: string
  name: string
  nickname?: string
  abbreviation: string
  displayName: string
  shortDisplayName: string
  color?: string
  alternateColor?: string
  isActive: boolean
  isAllStar?: boolean
  logos?: ESPNTeamLogo[]
  links?: Array<{
    language: string
    rel: string[]
    href: string
    text: string
    shortText: string
    isExternal: boolean
    isPremium: boolean
  }>
}

export interface ESPNSportsTeam {
  team: ESPNTeam
}

export interface ESPNTeamsResponse {
  sports: Array<{
    id: string
    uid: string
    name: string
    slug: string
    leagues: Array<{
      id: string
      uid: string
      name: string
      abbreviation: string
      shortName: string
      slug: string
      teams: ESPNSportsTeam[]
      year?: number
      season?: {
        year: number
        displayName: string
      }
    }>
  }>
}
