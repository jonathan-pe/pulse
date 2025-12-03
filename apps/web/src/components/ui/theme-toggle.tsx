import { Sun, Moon, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/useTheme'
import type { Theme } from '@/types/ui'

const THEME_TOGGLE_SIZE = 16

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Toggle theme'
      onClick={() => setTheme(nextTheme)}
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
