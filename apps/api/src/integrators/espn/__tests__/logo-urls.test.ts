import { describe, expect, it } from 'vitest'
import { extractLogoUrlDark, extractLogoUrlLight } from '../logo-urls.js'
import type { ESPNTeam } from '../types.js'

/** OKC-style ordering: default then 500-dark */
function okcLikeTeam(): ESPNTeam {
  return {
    id: '25',
    uid: 's:40~l:46~t:25',
    slug: 'oklahoma-city-thunder',
    location: 'Oklahoma City',
    name: 'Thunder',
    abbreviation: 'OKC',
    displayName: 'Oklahoma City Thunder',
    shortDisplayName: 'Thunder',
    isActive: true,
    logos: [
      {
        href: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
        width: 500,
        height: 500,
        alt: '',
        rel: ['full', 'default'],
      },
      {
        href: 'https://a.espncdn.com/i/teamlogos/nba/500-dark/okc.png',
        width: 500,
        height: 500,
        alt: '',
        rel: ['full', 'dark'],
      },
    ],
  }
}

describe('extractLogoUrlLight', () => {
  it('prefers default full logo over dark variant', () => {
    const t = okcLikeTeam()
    expect(extractLogoUrlLight(t)).toBe('https://a.espncdn.com/i/teamlogos/nba/500/okc.png')
  })

  it('ignores scoreboard composites when a standard default exists', () => {
    const t: ESPNTeam = {
      ...okcLikeTeam(),
      logos: [
        {
          href: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/okc.png',
          width: 500,
          height: 500,
          alt: '',
          rel: ['full', 'scoreboard'],
        },
        {
          href: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
          width: 500,
          height: 500,
          alt: '',
          rel: ['full', 'default'],
        },
      ],
    }
    expect(extractLogoUrlLight(t)).toContain('/500/okc.png')
    expect(extractLogoUrlLight(t)).not.toContain('scoreboard')
  })
})

describe('extractLogoUrlDark', () => {
  it('prefers 500-dark path', () => {
    const t = okcLikeTeam()
    expect(extractLogoUrlDark(t)).toBe('https://a.espncdn.com/i/teamlogos/nba/500-dark/okc.png')
  })

  it('returns null when no dark variant', () => {
    const t: ESPNTeam = {
      ...okcLikeTeam(),
      logos: [
        {
          href: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
          width: 500,
          height: 500,
          alt: '',
          rel: ['full', 'default'],
        },
      ],
    }
    expect(extractLogoUrlDark(t)).toBeNull()
  })
})
