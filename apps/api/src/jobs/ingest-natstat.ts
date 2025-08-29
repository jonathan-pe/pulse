import { loadMarket } from '../integrators/natstat/client'
import { normalizeMarket } from '../integrators/natstat/normalize'
import { prisma } from '@pulse/db'

type JobInput = { date?: string; league?: string }

export async function ingestNatStat({ date, league }: JobInput) {
  // 1) load markets
  const [mlRaw, spreadRaw, totalRaw] = await Promise.all([
    loadMarket({ market: 'moneyline', league, date }),
    loadMarket({ market: 'pointspread', league, date }),
    loadMarket({ market: 'overunder', league, date }),
  ])

  // 2) normalize — loadMarket now returns the full provider payload (wrapper), so normalizeMarket expects that
  const ml = normalizeMarket(mlRaw, 'moneyline')
  const sp = normalizeMarket(spreadRaw, 'pointspread')
  const to = normalizeMarket(totalRaw, 'overunder')

  console.log({ ml, sp, to })

  // Merge by identity into a map
  const events = new Map<string, any>()

  function merge(evtList: any[]) {
    for (const e of evtList) {
      const key = e.identity
      const cur = events.get(key) ?? { ...e, lines: [] }
      cur.externalEventId = cur.externalEventId ?? e.externalEventId
      cur.league = cur.league ?? e.league
      cur.startsAt = cur.startsAt ?? e.startsAt
      cur.homeTeam = cur.homeTeam ?? e.homeTeam
      cur.awayTeam = cur.awayTeam ?? e.awayTeam
      cur.lines = cur.lines.concat(e.lines)
      events.set(key, cur)
    }
  }

  merge(ml)
  merge(sp)
  merge(to)

  // 3) upsert into DB
  const results: { identity: string; gameId?: string; oddsUpserted: number }[] = []

  for (const [identity, ev] of events.entries()) {
    // minimal validation
    if (!ev.homeTeam || !ev.awayTeam || !ev.startsAt) {
      continue
    }

    // Upsert game by deterministic unique key: use a synthetic externalId stored in a custom column? Prisma schema doesn't have externalId, so use a lookup by unique fields (league, startsAt, teams)
    const gameWhere = {
      league: ev.league ?? 'unknown',
      startsAt: new Date(ev.startsAt),
      homeTeam: ev.homeTeam,
      awayTeam: ev.awayTeam,
    }

    // Find existing
    let game = await prisma.game.findFirst({ where: gameWhere })
    if (!game) {
      game = await prisma.game.create({ data: { ...gameWhere } })
    } else {
      // Optionally update start time or status
      await prisma.game.update({
        where: { id: game.id },
        data: { startsAt: new Date(ev.startsAt), league: ev.league ?? game.league },
      })
    }

    // Upsert odds lines per provider (provider column is `provider` in GameOdds model)
    let oddsUpserted = 0
    for (const line of ev.lines) {
      const provider = 'natstat'
      const book = line.book ?? 'natstat'
      const market = line.market ?? 'moneyline'

      // Use Prisma upsert keyed by the composite unique ([gameId, book, market])
      await prisma.gameOdds.upsert({
        where: { gameId_book_market: { gameId: game.id, book, market } },
        update: {
          provider,
          moneylineHome: line.moneylineHome ?? undefined,
          moneylineAway: line.moneylineAway ?? undefined,
          spread: line.spread ?? undefined,
          total: line.total ?? undefined,
          updatedAt: new Date(line.updatedAt ?? Date.now()),
        },
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

    results.push({ identity, gameId: game.id, oddsUpserted })
  }

  return { ok: true, counts: { events: events.size, rows: results.length }, details: results }
}
