import { prisma } from '@/lib/db'
import type { ParlayTicketType, PredictionType } from '@/lib/db'
import type { UnifiedGameOdds } from '@pulse/types'
import {
  combinedIndependentImpliedPercentFromAmericanOdds,
  previewMultiGameParlayPoints,
  previewSameGameParlayPoints,
  sgpAdjustedImpliedPercent,
} from '@pulse/shared'
import { createLogger } from '../lib/logger'
import { PredictionRejectedError } from '../lib/api-errors'
import { oddsAggregationService } from './odds-aggregation.service'
import { predictionsService } from './predictions.service'
import type { OddsSnapshot } from './points.service'

const logger = createLogger('ParlaysService')

export const PRICING_VERSION_MULTI = 'parlay-v1'
export const PRICING_VERSION_SGP = 'parlay-sgp-v1'

export interface ParlayLegInput {
  gameId: string
  type: PredictionType
  pick: string
}

export interface CreateParlayInput {
  ticketType: ParlayTicketType
  legs: ParlayLegInput[]
}

export interface ParlayQuoteResult {
  ticketType: ParlayTicketType
  combinedImpliedProbability: number
  /** Decimal 0–1 for API contract / clients that expect a ratio */
  combinedImpliedProbabilityRatio: number
  pricingVersion: string
  sgpAdjustment: {
    naiveCombinedPercent: number
    adjustedCombinedPercent: number
  } | null
  winPointsRounded: number
  lossPoints: number
}

function legKey(gameId: string, type: PredictionType, pick: string): string {
  return `${gameId}:${type}:${pick}`
}

function assertUniqueLegsInRequest(legs: ParlayLegInput[]): void {
  const seen = new Set<string>()
  for (const leg of legs) {
    const k = legKey(leg.gameId, leg.type, leg.pick)
    if (seen.has(k)) {
      throw new PredictionRejectedError(
        'PARLAY_LEG_DUPLICATE',
        'Duplicate leg in parlay request (same game, type, and pick).'
      )
    }
    seen.add(k)
  }
}

function assertTicketTypeMatchesGames(ticketType: ParlayTicketType, legs: ParlayLegInput[]): void {
  const gameIds = [...new Set(legs.map((l) => l.gameId))]
  if (ticketType === 'MULTI_GAME') {
    if (gameIds.length !== legs.length) {
      throw new PredictionRejectedError(
        'PARLAY_INVALID_GAME_MIX',
        'Multi-game parlay must use a different game for each leg. Use SAME_GAME for multiple picks on one game.'
      )
    }
  } else {
    if (gameIds.length !== 1) {
      throw new PredictionRejectedError(
        'PARLAY_INVALID_GAME_MIX',
        'Same-game parlay must include legs from exactly one game.'
      )
    }
  }
}

/**
 * v1 conservative block: moneyline + spread on the same side (same pick string home/away) is treated as a disallowed redundant SGP.
 */
function assertSgpCombosAllowed(legs: ParlayLegInput[]): void {
  const byGame = new Map<string, ParlayLegInput[]>()
  for (const leg of legs) {
    const list = byGame.get(leg.gameId) ?? []
    list.push(leg)
    byGame.set(leg.gameId, list)
  }
  for (const [, group] of byGame) {
    if (group.length < 2) continue
    const hasMlHome = group.some((l) => l.type === 'MONEYLINE' && l.pick === 'home')
    const hasMlAway = group.some((l) => l.type === 'MONEYLINE' && l.pick === 'away')
    const hasSpHome = group.some((l) => l.type === 'SPREAD' && l.pick === 'home')
    const hasSpAway = group.some((l) => l.type === 'SPREAD' && l.pick === 'away')
    if ((hasMlHome && hasSpHome) || (hasMlAway && hasSpAway)) {
      throw new PredictionRejectedError(
        'SGP_COMBO_NOT_ALLOWED',
        'This same-game combination (moneyline and spread on the same side) is not allowed.'
      )
    }
  }
}

function buildOddsSnapshot(unified: UnifiedGameOdds): OddsSnapshot {
  return {
    moneyline: unified.moneyline ?? undefined,
    spread: unified.spread ?? undefined,
    total: unified.total ?? undefined,
  }
}

function americanOddsForLeg(type: PredictionType, pick: string, unified: UnifiedGameOdds): number {
  switch (type) {
    case 'MONEYLINE': {
      const side = pick === 'home' ? 'home' : 'away'
      const o = unified.moneyline?.[side]
      if (o === undefined || o === null || o === 0) {
        throw new PredictionRejectedError(
          'GAME_NOT_OPEN',
          'Moneyline odds are not available for this leg.'
        )
      }
      return o
    }
    case 'SPREAD': {
      const key = pick === 'home' ? 'homePrice' : 'awayPrice'
      return unified.spread?.[key] ?? -110
    }
    case 'TOTAL': {
      const key = pick === 'over' ? 'overPrice' : 'underPrice'
      return unified.total?.[key] ?? -110
    }
    default:
      throw new PredictionRejectedError('GAME_NOT_OPEN', 'Invalid prediction type for parlay leg.')
  }
}

async function assertNoPendingSingleOnLegs(userId: string, legs: ParlayLegInput[]): Promise<void> {
  for (const leg of legs) {
    const pending = await prisma.prediction.findFirst({
      where: {
        userId,
        gameId: leg.gameId,
        type: leg.type,
        pick: leg.pick,
        outcome: null,
      },
    })
    if (pending) {
      throw new PredictionRejectedError(
        'MARKET_ALREADY_SINGLE',
        'This market already has a pending single prediction. Finish or settle it before adding it to a parlay.'
      )
    }
  }
}

async function assertNoPendingParlayLegOnMarkets(userId: string, legs: ParlayLegInput[]): Promise<void> {
  for (const leg of legs) {
    const existing = await prisma.parlayLeg.findFirst({
      where: {
        gameId: leg.gameId,
        type: leg.type,
        pick: leg.pick,
        parlay: { userId, status: 'PENDING' },
      },
    })
    if (existing) {
      throw new PredictionRejectedError(
        'MARKET_ALREADY_IN_PARLAY',
        'This market is already used on a pending parlay ticket.'
      )
    }
  }
}

function computeQuote(ticketType: ParlayTicketType, americanOdds: number[]): ParlayQuoteResult {
  if (ticketType === 'MULTI_GAME') {
    const preview = previewMultiGameParlayPoints(americanOdds)
    const combined = combinedIndependentImpliedPercentFromAmericanOdds(americanOdds)
    return {
      ticketType,
      combinedImpliedProbability: combined,
      combinedImpliedProbabilityRatio: combined / 100,
      pricingVersion: PRICING_VERSION_MULTI,
      sgpAdjustment: null,
      winPointsRounded: preview.winPointsRounded,
      lossPoints: preview.lossPoints,
    }
  }

  const naive = combinedIndependentImpliedPercentFromAmericanOdds(americanOdds)
  const adjusted = sgpAdjustedImpliedPercent(naive, PRICING_VERSION_SGP)
  const preview = previewSameGameParlayPoints(americanOdds, undefined, PRICING_VERSION_SGP)
  return {
    ticketType,
    combinedImpliedProbability: adjusted,
    combinedImpliedProbabilityRatio: adjusted / 100,
    pricingVersion: PRICING_VERSION_SGP,
    sgpAdjustment: {
      naiveCombinedPercent: naive,
      adjustedCombinedPercent: adjusted,
    },
    winPointsRounded: preview.winPointsRounded,
    lossPoints: preview.lossPoints,
  }
}

export class ParlaysService {
  /**
   * Price a parlay without persisting (odds must be available for every leg).
   * When `userId` is set, enforces duplicate-market rules against pending singles and parlays (same as create).
   */
  async quote(userId: string | undefined, input: CreateParlayInput): Promise<ParlayQuoteResult> {
    const legs = input.legs
    if (legs.length < 2 || legs.length > 20) {
      throw new PredictionRejectedError(
        'PARLAY_LEG_COUNT',
        'Parlay must include between 2 and 20 legs.'
      )
    }
    assertUniqueLegsInRequest(legs)
    assertTicketTypeMatchesGames(input.ticketType, legs)
    if (input.ticketType === 'SAME_GAME') {
      assertSgpCombosAllowed(legs)
    }

    if (userId) {
      await assertNoPendingSingleOnLegs(userId, legs)
      await assertNoPendingParlayLegOnMarkets(userId, legs)
    }

    const americanOdds: number[] = []
    for (const leg of legs) {
      const validationError = await predictionsService.validatePrediction(
        { userId: userId ?? 'anonymous', gameId: leg.gameId, type: leg.type, pick: leg.pick },
        { forParlayLeg: true, skipUserConflictChecks: true }
      )
      if (validationError) {
        throw new PredictionRejectedError('GAME_NOT_OPEN', validationError.message)
      }

      const gameOdds = await prisma.gameOdds.findMany({ where: { gameId: leg.gameId } })
      const unified = oddsAggregationService.aggregateOdds(gameOdds)
      americanOdds.push(americanOddsForLeg(leg.type, leg.pick, unified))
    }

    return computeQuote(input.ticketType, americanOdds)
  }

  async createParlay(userId: string, input: CreateParlayInput) {
    const legs = input.legs
    if (legs.length < 2 || legs.length > 20) {
      throw new PredictionRejectedError(
        'PARLAY_LEG_COUNT',
        'Parlay must include between 2 and 20 legs.'
      )
    }

    assertUniqueLegsInRequest(legs)
    assertTicketTypeMatchesGames(input.ticketType, legs)
    if (input.ticketType === 'SAME_GAME') {
      assertSgpCombosAllowed(legs)
    }

    for (const leg of legs) {
      const validationError = await predictionsService.validatePrediction(
        { userId, gameId: leg.gameId, type: leg.type, pick: leg.pick },
        { forParlayLeg: true }
      )
      if (validationError) {
        throw new PredictionRejectedError('GAME_NOT_OPEN', validationError.message)
      }
    }

    await assertNoPendingSingleOnLegs(userId, legs)
    await assertNoPendingParlayLegOnMarkets(userId, legs)

    const americanOdds: number[] = []
    const snapshots: OddsSnapshot[] = []

    for (const leg of legs) {
      const gameOdds = await prisma.gameOdds.findMany({ where: { gameId: leg.gameId } })
      const unified = oddsAggregationService.aggregateOdds(gameOdds)
      snapshots.push(buildOddsSnapshot(unified))
      americanOdds.push(americanOddsForLeg(leg.type, leg.pick, unified))
    }

    const quote = computeQuote(input.ticketType, americanOdds)

    const parlay = await prisma.$transaction(async (tx) => {
      const created = await tx.parlay.create({
        data: {
          userId,
          ticketType: input.ticketType,
          pricingVersion: quote.pricingVersion,
          combinedImpliedProbability: quote.combinedImpliedProbability,
          sgpMetadata: quote.sgpAdjustment as object | undefined,
        },
      })

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i]!
        const snap = snapshots[i]!
        await tx.parlayLeg.create({
          data: {
            parlayId: created.id,
            gameId: leg.gameId,
            type: leg.type,
            pick: leg.pick,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            oddsSnapshot: snap as any,
          },
        })
      }

      return created
    })

    logger.info('Parlay created', {
      parlayId: parlay.id,
      userId,
      ticketType: input.ticketType,
      legCount: legs.length,
    })

    return this.getParlayById(userId, parlay.id)
  }

  async listParlays(userId: string) {
    return prisma.parlay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        legs: {
          include: {
            game: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                startsAt: true,
                league: true,
                status: true,
              },
            },
          },
        },
      },
    })
  }

  async getParlayById(userId: string, parlayId: string) {
    const parlay = await prisma.parlay.findFirst({
      where: { id: parlayId, userId },
      include: {
        legs: {
          include: {
            game: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                startsAt: true,
                league: true,
                status: true,
              },
            },
          },
        },
      },
    })
    return parlay
  }
}

export const parlaysService = new ParlaysService()
