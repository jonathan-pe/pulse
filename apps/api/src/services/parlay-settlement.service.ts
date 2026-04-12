import { prisma } from '@/lib/db'
import type { ParlayLegOutcome, ParlayTicketStatus, ParlayTicketType } from '@/lib/db'
import {
  resolveParlayTicketStatus,
  settlementPointsForParlay,
  type ParlayLegOutcomeToken,
} from '@pulse/shared'
import { createLogger } from '../lib/logger'
import { pointsService, type PredictionWithGame } from './points.service'
import { americanOddsFromLegSnapshot } from './parlays.service'
import type { OddsSnapshot } from './points.service'

const logger = createLogger('ParlaySettlementService')

function toOutcomeTokens(outcomes: (ParlayLegOutcome | null)[]): ParlayLegOutcomeToken[] {
  return outcomes.map((o) => {
    if (o === 'WIN' || o === 'LOSS' || o === 'PUSH') return o
    throw new Error('Missing parlay leg outcome')
  })
}

function parlayLegToPredictionWithGame(
  leg: { id: string; gameId: string; type: string; pick: string; oddsSnapshot: unknown },
  userId: string,
  game: PredictionWithGame['game']
): PredictionWithGame {
  return {
    id: leg.id,
    userId,
    gameId: leg.gameId,
    type: leg.type as PredictionWithGame['type'],
    pick: leg.pick,
    oddsAtPrediction: leg.oddsSnapshot as OddsSnapshot | null,
    game,
  }
}

/**
 * After a game is fully scored, resolve pending parlay legs on that game and settle any parlay tickets that are now complete.
 */
export class ParlaySettlementService {
  async settleParlaysAfterGameScored(gameId: string): Promise<void> {
    const pendingLegs = await prisma.parlayLeg.findMany({
      where: {
        gameId,
        outcome: null,
        parlay: { status: 'PENDING' },
      },
      include: {
        parlay: true,
        game: {
          include: { result: true },
        },
      },
    })

    if (pendingLegs.length === 0) {
      return
    }

    const parlayIdsToTry = new Set<string>()

    for (const leg of pendingLegs) {
      if (!leg.game.result) {
        logger.warn('Parlay leg game has no result yet; skipping leg', { legId: leg.id, gameId })
        continue
      }

      const predictionLike = parlayLegToPredictionWithGame(
        leg,
        leg.parlay.userId,
        {
          league: leg.game.league,
          result: {
            homeScore: leg.game.result.homeScore,
            awayScore: leg.game.result.awayScore,
          },
        }
      )

      const resolution = pointsService.getPredictionOutcome(predictionLike)
      const outcome: ParlayLegOutcome = resolution

      await prisma.parlayLeg.update({
        where: { id: leg.id },
        data: { outcome },
      })

      await pointsService.updateParlayLegStreak(leg.parlay.userId, resolution)

      parlayIdsToTry.add(leg.parlayId)
    }

    for (const parlayId of parlayIdsToTry) {
      await this.trySettleParlayTicket(parlayId)
    }
  }

  /**
   * When every leg has an outcome, compute ticket result, one ledger line, and final status.
   */
  async trySettleParlayTicket(parlayId: string): Promise<void> {
    const parlay = await prisma.parlay.findUnique({
      where: { id: parlayId },
      include: {
        legs: {
          orderBy: { id: 'asc' },
        },
      },
    })

    if (!parlay || parlay.status !== 'PENDING') {
      return
    }

    if (parlay.legs.some((l) => l.outcome === null)) {
      return
    }

    const tokens = toOutcomeTokens(parlay.legs.map((l) => l.outcome))
    const ticketStatus = resolveParlayTicketStatus(tokens)

    const nonPushLegs = parlay.legs.filter((l) => l.outcome !== 'PUSH')
    const effectiveAmericanOdds: number[] = []
    for (const leg of nonPushLegs) {
      effectiveAmericanOdds.push(
        americanOddsFromLegSnapshot(leg.type, leg.pick, leg.oddsSnapshot as OddsSnapshot)
      )
    }

    const settlementStatus =
      ticketStatus === 'WON' ? 'WON' : ticketStatus === 'LOST' ? 'LOST' : 'PUSHED'

    const { pointsRounded, combinedImpliedPercent } = settlementPointsForParlay(
      parlay.ticketType as ParlayTicketType,
      parlay.pricingVersion,
      effectiveAmericanOdds,
      settlementStatus
    )

    const prismaStatus: ParlayTicketStatus =
      ticketStatus === 'WON' ? 'WON' : ticketStatus === 'LOST' ? 'LOST' : 'PUSHED'

    const processedAt = new Date()

    const meta = {
      parlayId: parlay.id,
      ticketType: parlay.ticketType,
      ticketStatus,
      pricingVersion: parlay.pricingVersion,
      combinedImpliedPercent,
      legResults: parlay.legs.map((l) => ({
        gameId: l.gameId,
        type: l.type,
        pick: l.pick,
        outcome: l.outcome,
      })),
      effectiveNonPushLegCount: nonPushLegs.length,
    }

    const reason =
      ticketStatus === 'PUSHED'
        ? `Parlay push (no net legs) — ticket ${parlay.id}`
        : ticketStatus === 'WON'
          ? `Parlay win — ticket ${parlay.id}`
          : `Parlay loss — ticket ${parlay.id}`

    const userBefore = await prisma.user.findUnique({
      where: { id: parlay.userId },
      select: { largestParlayWinLegCount: true },
    })
    const priorLargest = userBefore?.largestParlayWinLegCount ?? 0
    const legCount = effectiveAmericanOdds.length
    const newLargest =
      ticketStatus === 'WON' && legCount > priorLargest ? legCount : undefined

    await prisma.$transaction(async (tx) => {
      await tx.pointsLedger.create({
        data: {
          userId: parlay.userId,
          delta: pointsRounded,
          reason,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta: meta as any,
        },
      })

      await tx.parlay.update({
        where: { id: parlayId },
        data: {
          status: prismaStatus,
          processedAt,
        },
      })

      if (newLargest !== undefined) {
        await tx.user.update({
          where: { id: parlay.userId },
          data: { largestParlayWinLegCount: newLargest },
        })
      }
    })

    logger.info('Parlay ledger entry created', {
      parlayId,
      userId: parlay.userId,
      delta: pointsRounded,
      reason,
    })

    if (ticketStatus === 'WON' && effectiveAmericanOdds.length > 0) {
      const { achievementsService } = await import('./achievements.service.js')
      await achievementsService.checkAndUnlockAchievements(parlay.userId)
    }

    logger.info('Parlay ticket settled', {
      parlayId,
      userId: parlay.userId,
      ticketStatus,
      pointsRounded,
    })
  }
}

export const parlaySettlementService = new ParlaySettlementService()
