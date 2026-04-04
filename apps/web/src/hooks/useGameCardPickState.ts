import type { GameWithUnifiedOdds } from '@pulse/types'
import useCartStore from '@/store/cart'
import { usePredictionsByGame } from '@/hooks/usePredictions'

export type GameCardMarket = 'moneyline' | 'spread' | 'total'
export type GameCardSide = 'home' | 'away' | 'over' | 'under'
export type GameCardPredictionType = 'MONEYLINE' | 'SPREAD' | 'TOTAL'

export function useGameCardPickState(game: GameWithUnifiedOdds) {
  const addSelection = useCartStore((s) => s.addSelection)
  const selections = useCartStore((s) => s.selections)
  const setCartOpen = useCartStore((s) => s.setCartOpen)

  const { data: predictionsByGame } = usePredictionsByGame()

  const hasSelection = (market: GameCardMarket, side: GameCardSide) =>
    selections.some((s) => s.gameId === game.id && s.market === market && s.side === side)

  const hasPrediction = (type: GameCardPredictionType, pick: string): boolean => {
    if (!predictionsByGame || !predictionsByGame[game.id]) return false
    return predictionsByGame[game.id][type] === pick
  }

  const isGameLocked = new Date(game.startsAt) < new Date()

  const handleAddToCart = (market: GameCardMarket, side: GameCardSide, odds: number, teamName?: string) => {
    const isCurrentlySelected = hasSelection(market, side)

    addSelection({
      gameId: game.id,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      league: game.league,
      startsAt: new Date(game.startsAt),
      market,
      side,
      odds,
      teamName,
    })

    if (!isCurrentlySelected) {
      setCartOpen(true)
    }
  }

  return {
    isGameLocked,
    hasSelection,
    hasPrediction,
    handleAddToCart,
  }
}
