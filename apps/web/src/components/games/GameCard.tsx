import React from 'react'
import type { GameWithUnifiedOdds } from '@pulse/types'
import { Card, CardContent } from '@/components/ui/card'
import { useGameCardPickState } from '@/hooks/useGameCardPickState'
import { GameCardHeader } from '@/components/games/GameCardHeader'
import { GameCardMatchup } from '@/components/games/GameCardMatchup'
import { GameCardMarkets } from '@/components/games/GameCardMarkets'

interface GameCardProps {
  game: GameWithUnifiedOdds
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const { isGameLocked, hasSelection, hasPrediction, handleAddToCart } = useGameCardPickState(game)

  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-md'>
      <CardContent className='px-6'>
        <GameCardHeader
          league={game.league}
          isGameLocked={isGameLocked}
          status={game.status}
          startsAt={game.startsAt}
        />

        <GameCardMatchup awayTeam={game.awayTeam} homeTeam={game.homeTeam} result={game.result} />

        {!isGameLocked && (
          <GameCardMarkets
            game={game}
            isGameLocked={isGameLocked}
            hasSelection={hasSelection}
            hasPrediction={hasPrediction}
            handleAddToCart={handleAddToCart}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default GameCard
