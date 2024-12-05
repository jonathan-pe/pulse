import { Card, CardContent } from '@/app/components/ui/card'
import useCart from '@/app/hooks/use-cart'
import { Odds } from '@/types/game'
import { LockIcon } from 'lucide-react'

interface OddCardProps {
  odd: Odds | undefined
  event: string
}

const displayPoints = (points: number | null, selection: string, market: string) => {
  if (!points || market.includes('Moneyline')) return

  if (market.includes('Total Points') || selection === 'Over' || selection === 'Under') {
    return (
      <span className='font-semibold'>
        {selection.charAt(0)} {points}
      </span>
    )
  }

  return <span className='font-semibold'>{`${points > 0 ? '+' : ''}${points}`}</span>
}

const OddCard = ({ odd, event }: OddCardProps) => {
  const { cart, addToCart, removeFromCart } = useCart()

  return !odd ? (
    <Card
      className='flex cursor-not-allowed items-center justify-center opacity-50'
      onClick={(event) => {
        event.preventDefault()
      }}
    >
      <LockIcon size={24} />
    </Card>
  ) : (
    <Card
      className={`flex min-w-20 cursor-pointer items-center justify-center p-2 hover:bg-primary/15 active:bg-primary/10 ${
        cart?.find((o) => o.id === odd?.id) ? 'bg-primary/20' : ''
      }`}
      onClick={(e) => {
        e.preventDefault()

        if (odd && !cart?.find((o) => o.id === odd?.id)) {
          addToCart(odd, event)
        } else if (odd) {
          removeFromCart(odd?.id)
        }
      }}
    >
      <CardContent className='flex flex-col items-center justify-center p-0'>
        {displayPoints(odd.points, odd.selection, odd.market)}
        <span className='text-primary'>{odd?.price}</span>
      </CardContent>
    </Card>
  )
}

export default OddCard
