import { TrendingUp, TrendingDown } from 'lucide-react'
import { calculateBasePoints, calculateIncorrectPoints } from '@pulse/shared'

interface PredictionPointsPreviewProps {
  odds: number
  className?: string
}

/**
 * Shows the potential points for correct (green) and incorrect (red) predictions
 * Helps users understand the risk/reward before making a prediction
 */
export function PredictionPointsPreview({ odds, className = '' }: PredictionPointsPreviewProps) {
  const correctPoints = Math.round(calculateBasePoints(odds))
  const incorrectPoints = calculateIncorrectPoints(odds).toFixed(1)

  return (
    <div className={`flex items-center justify-between gap-4 text-xs ${className}`}>
      <div className='flex items-center gap-1 text-green-600'>
        <TrendingUp className='h-3 w-3' />
        <span className='font-medium'>
          If correct: <span className='font-bold'>+{correctPoints}</span>
        </span>
      </div>
      <div className='flex items-center gap-1 text-red-600'>
        <TrendingDown className='h-3 w-3' />
        <span className='font-medium'>
          If incorrect: <span className='font-bold'>{incorrectPoints}</span>
        </span>
      </div>
    </div>
  )
}
