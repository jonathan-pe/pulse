import { Sun, Moon, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/useTheme'

const THEME_TOGGLE_SIZE = 16

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Toggle theme'
      onClick={() => setTheme(next as any)}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' ? (
        <Sun size={THEME_TOGGLE_SIZE} />
      ) : theme === 'dark' ? (
        <Moon size={THEME_TOGGLE_SIZE} />
      ) : (
        <Laptop size={THEME_TOGGLE_SIZE} />
      )}
    </Button>
  )
}

export default ThemeToggle
