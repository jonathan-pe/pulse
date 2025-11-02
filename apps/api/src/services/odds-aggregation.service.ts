import type { UnifiedGameOdds } from '@pulse/types'
import { createLogger } from '../lib/logger'

const logger = createLogger('OddsAggregationService')

/**
 * Raw odds from the database with provider details
 */
interface RawGameOdds {
  id: string
  gameId: string
  provider: string
  market: string | null
  book: string | null
  moneylineHome: number | null
  moneylineAway: number | null
  spread: number | null
  total: number | null
  updatedAt: Date
}

/**
 * Strategy for selecting which odds to display when multiple providers exist.
 * Currently implements a simple "first available" strategy, but can be extended to:
 * - Select best odds for the user (highest value)
 * - Select from a preferred provider
 * - Select most recently updated
 */
type OddsSelectionStrategy = 'first-available' | 'best-odds' | 'most-recent'

/**
 * OddsAggregationService - Transforms provider-specific odds into a unified view
 *
 * This service abstracts away provider details, allowing the backend to source
 * odds from multiple providers while presenting a single, consistent interface
 * to the client.
 */
export class OddsAggregationService {
  private strategy: OddsSelectionStrategy = 'first-available'

  /**
   * Aggregate multiple odds entries into a single unified odds object
   */
  aggregateOdds(rawOdds: RawGameOdds[]): UnifiedGameOdds {
    if (rawOdds.length === 0) {
      logger.debug('No odds to aggregate')
      return {
        moneyline: null,
        spread: null,
        total: null,
      }
    }

    const gameId = rawOdds[0]?.gameId

    // Group by market type
    const moneylineOdds = rawOdds.filter((o) => o.market === 'moneyline')
    const spreadOdds = rawOdds.filter((o) => o.market === 'pointspread')
    const totalOdds = rawOdds.filter((o) => o.market === 'overunder')

    const result: UnifiedGameOdds = {
      moneyline: null,
      spread: null,
      total: null,
    }

    // Select moneyline
    const selectedMoneyline = this.selectOdd(moneylineOdds)
    if (selectedMoneyline?.moneylineHome && selectedMoneyline?.moneylineAway) {
      result.moneyline = {
        home: selectedMoneyline.moneylineHome,
        away: selectedMoneyline.moneylineAway,
      }
      logger.debug('Selected moneyline odds', {
        gameId,
        provider: selectedMoneyline.provider,
        book: selectedMoneyline.book,
      })
    }

    // Select spread
    const selectedSpread = this.selectOdd(spreadOdds)
    if (selectedSpread?.spread !== null && selectedSpread?.spread !== undefined) {
      result.spread = {
        value: selectedSpread.spread,
      }
      logger.debug('Selected spread odds', {
        gameId,
        provider: selectedSpread.provider,
        book: selectedSpread.book,
      })
    }

    // Select total
    const selectedTotal = this.selectOdd(totalOdds)
    if (selectedTotal?.total !== null && selectedTotal?.total !== undefined) {
      result.total = {
        value: selectedTotal.total,
      }
      logger.debug('Selected total odds', {
        gameId,
        provider: selectedTotal.provider,
        book: selectedTotal.book,
      })
    }

    return result
  }

  /**
   * Select a single odd from multiple options based on the configured strategy
   */
  private selectOdd(odds: RawGameOdds[]): RawGameOdds | null {
    if (odds.length === 0) return null

    switch (this.strategy) {
      case 'first-available':
        return odds[0]

      case 'most-recent':
        return odds.reduce((latest, current) =>
          current.updatedAt > latest.updatedAt ? current : latest
        )

      case 'best-odds':
        // For now, just return first; can implement actual best odds logic later
        // Best odds would require market-specific logic (e.g., higher moneyline for underdog)
        return odds[0]

      default:
        return odds[0]
    }
  }

  /**
   * Set the strategy for selecting odds
   */
  setStrategy(strategy: OddsSelectionStrategy) {
    this.strategy = strategy
    logger.info('Odds selection strategy updated', { strategy })
  }
}

// Export a singleton instance
export const oddsAggregationService = new OddsAggregationService()
