import { Odds } from '@/types/game'
import { useAppStore } from '../store'

const useCart = () => {
  const cart = useAppStore((state) => state.cart)
  const setCart = useAppStore((state) => state.setCart)

  const addToCart = (odds: Odds, event: string) => {
    if (!cart?.find((o) => o.id === odds.id)) {
      setCart((prev) => [...(prev ?? []), { ...odds, event }])
    }
  }

  const removeFromCart = (oddsId: string) => {
    setCart((prev) => prev?.filter((o) => o.id !== oddsId))
  }

  return { cart, addToCart, removeFromCart }
}

export default useCart
