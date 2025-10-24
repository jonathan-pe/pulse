import { prisma } from '@pulse/db'

export type Market = 'moneyline' | 'pointspread' | 'overunder'

export interface OddsLineInput {
  gameId: string
  provider: string
  book: string
  market: Market
  moneylineHome?: number | null
  moneylineAway?: number | null
  spread?: number | null
  total?: number | null
  updatedAt?: Date
}

/**
 * OddsService - Handles all odds-related business logic
 */
export class OddsService {
  /**
   * Upsert an odds line using the composite unique key (gameId, book, market)
   * Only updates fields that are provided and non-null
   */
  async upsertOddsLine(input: OddsLineInput) {
    const { gameId, provider, book, market, updatedAt, ...marketData } = input

    // Build update data object with only non-null values
    const updateData: Record<string, unknown> = {
      provider,
      updatedAt: updatedAt ?? new Date(),
    }

    // Add market-specific fields only if they are defined
    if (market === 'moneyline') {
      if (marketData.moneylineHome !== undefined) updateData.moneylineHome = marketData.moneylineHome
      if (marketData.moneylineAway !== undefined) updateData.moneylineAway = marketData.moneylineAway
    } else if (market === 'pointspread') {
      if (marketData.spread !== undefined) updateData.spread = marketData.spread
    } else if (market === 'overunder') {
      if (marketData.total !== undefined) updateData.total = marketData.total
    }

    await prisma.gameOdds.upsert({
      where: {
        gameId_book_market: { gameId, book, market },
      },
      update: updateData,
      create: {
        gameId,
        provider,
        book,
        market,
        moneylineHome: marketData.moneylineHome ?? null,
        moneylineAway: marketData.moneylineAway ?? null,
        spread: marketData.spread ?? null,
        total: marketData.total ?? null,
      },
    })
  }

  /**
   * Batch upsert multiple odds lines for a game
   * Returns the count of lines upserted
   */
  async upsertOddsLines(lines: OddsLineInput[]) {
    for (const line of lines) {
      await this.upsertOddsLine(line)
    }
    return lines.length
  }
}

// Export a singleton instance
export const oddsService = new OddsService()
