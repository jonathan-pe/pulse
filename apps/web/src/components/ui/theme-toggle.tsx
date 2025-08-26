import { Sun, Moon, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/useTheme'

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
      {theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Laptop size={16} />}
    </Button>
  )
}

export default ThemeToggle
