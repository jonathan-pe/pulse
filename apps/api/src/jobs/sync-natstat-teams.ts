import { loadTeamCodes } from '../integrators/natstat/client.js'
import { prisma } from '@pulse/db'

type JobInput = { league: string }

/**
 * Sync team codes from NatStat's /teamcodes endpoint to our database.
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

  // Load team codes from NatStat
  const teamCodesRaw = await loadTeamCodes({ league: natstatLeague })

  // Extract teamcodes map
  const teamcodes = teamCodesRaw?.teamcodes
  if (!teamcodes || typeof teamcodes !== 'object') {
    throw new Error('Invalid team codes response from NatStat')
  }

  const teams = Object.entries(teamcodes)
  let created = 0
  let updated = 0
  let skipped = 0

  for (const [teamKey, teamData] of teams) {
    // Extract team ID from key (e.g., "team_2022531" -> "2022531")
    const teamId = teamKey.replace('team_', '')
    const code = (teamData as any).code
    const name = (teamData as any).name
    const active = (teamData as any).active === 'Y'

    if (!code || !name) {
      skipped++
      continue
    }

    // Upsert team record
    const existing = await prisma.natStatTeam.findUnique({
      where: { id: teamId },
    })

    if (existing) {
      // Update if changed
      if (existing.code !== code || existing.name !== name || existing.active !== active) {
        await prisma.natStatTeam.update({
          where: { id: teamId },
          data: {
            code,
            name,
            active,
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
        },
      })
      created++
    }
  }

  return {
    ok: true,
    league: normalizedLeague,
    counts: {
      total: teams.length,
      created,
      updated,
      skipped,
    },
  }
}
