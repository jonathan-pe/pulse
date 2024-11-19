import { Odds } from '@/types/game'
import { useAppStore } from '../store'

const useCart = () => {
  const cart = useAppStore((state) => state.cart)
  const setCart = useAppStore((state) => state.setCart)

  const addToCart = (odds: Odds) => {
    if (!cart?.find((o) => o.id === odds.id)) {
      setCart((prev) => [...(prev ?? []), odds])
    }
  }

  const removeFromCart = (odds: Odds) => {
    setCart((prev) => prev?.filter((o) => o.id !== odds.id))
  }

  return { cart, addToCart, removeFromCart }
}

export default useCart
