import type { ESPNTeam, ESPNTeamLogo } from './types.js'

/**
 * Prefer ESPN's /500/ CDN paths; avoid scoreboard composites and huge /guid/ assets for list UI.
 */
function isPreferredSmallCdnLight(href: string): boolean {
  return /\/i\/teamlogos\/[^/]+\/500\//.test(href) && !href.includes('/500-dark/') && !href.includes('/guid/')
}

function pickFirstHref(logos: ESPNTeamLogo[]): string | null {
  if (!logos.length) return null
  const preferred = logos.find((l) => isPreferredSmallCdnLight(l.href))
  return (preferred ?? logos[0]).href
}

/**
 * Logo intended for light UI backgrounds (default / full-color mark, not the dark-background variant).
 */
export function extractLogoUrlLight(team: ESPNTeam): string | null {
  const logos = team.logos
  if (!logos?.length) return null

  const noScoreboard = logos.filter((l) => !l.rel.includes('scoreboard'))
  const pool = noScoreboard.length ? noScoreboard : logos

  const ideal = pool.filter(
    (l) => l.rel.includes('full') && l.rel.includes('default') && !l.rel.includes('dark'),
  )
  if (ideal.length) return pickFirstHref(ideal)

  const fallback = pool.filter((l) => l.rel.includes('default') && !l.rel.includes('dark'))
  if (fallback.length) return pickFirstHref(fallback)

  const notDarkOnly = pool.filter((l) => !(l.rel.includes('dark') && !l.rel.includes('default')))
  if (notDarkOnly.length) return pickFirstHref(notDarkOnly)

  return logos[0]?.href ?? null
}

/**
 * Logo intended for dark UI backgrounds (typically rel includes "dark", e.g. 500-dark CDN path).
 */
export function extractLogoUrlDark(team: ESPNTeam): string | null {
  const logos = team.logos
  if (!logos?.length) return null

  const noScoreboard = logos.filter((l) => !l.rel.includes('scoreboard'))

  const fullDark = noScoreboard.filter((l) => l.rel.includes('full') && l.rel.includes('dark'))
  if (fullDark.length) {
    const preferred = fullDark.find((l) => l.href.includes('500-dark')) ?? fullDark[0]
    return preferred.href
  }

  const anyDark = noScoreboard.filter((l) => l.rel.includes('dark'))
  if (anyDark.length) {
    return (anyDark.find((l) => l.href.includes('500-dark')) ?? anyDark[0]).href
  }

  return null
}
