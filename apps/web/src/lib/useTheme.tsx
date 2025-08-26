import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const COOKIE_NAME = 'pulse_theme'
const STORAGE_KEY = 'pulse:theme' // kept for backward compatibility

function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function isValidTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark' || v === 'system'
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[]\\\/\\+^])/g, '\\$1') + '=([^;]*)')
  )
  return m ? decodeURIComponent(m[1]) : null
}

function writeCookie(name: string, value: string, opts: { days?: number; domain?: string } = {}) {
  if (typeof document === 'undefined') return
  const days = opts.days ?? 365
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax`
  if (opts.domain) str += `; Domain=${opts.domain}`
  // Don't force Secure because local dev may not be https
  document.cookie = str
}

function getCookieDomainForPlaypulse() {
  if (typeof location === 'undefined') return undefined
  try {
    const host = location.hostname
    const parts = host.split('.')
    const idx = parts.findIndex((p) => p.includes('playpulse'))
    if (idx !== -1) return '.' + parts.slice(idx).join('.')
  } catch {}
  return undefined
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const c = readCookie(COOKIE_NAME)
      if (isValidTheme(c)) return c
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      return (raw as Theme) || 'system'
    } catch {
      return 'system'
    }
  })

  const apply = useCallback((t: Theme) => {
    const root = document.documentElement
    const isDark = t === 'dark' || (t === 'system' && getSystemPrefersDark())
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      const domain = getCookieDomainForPlaypulse()
      writeCookie(COOKIE_NAME, t, { days: 365, domain })
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
  }, [])

  useEffect(() => apply(theme), [theme, apply])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      try {
        const c = readCookie(COOKIE_NAME)
        if (isValidTheme(c) && c !== theme) setThemeState(c)
        else {
          // fallback to localStorage
          const raw = localStorage.getItem(STORAGE_KEY)
          if (isValidTheme(raw) && raw !== theme) setThemeState(raw as Theme)
        }
      } catch {}
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const v = e.newValue
      if (isValidTheme(v) && v !== theme) setThemeState(v)
    }
    window.addEventListener('storage', onStorage)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('storage', onStorage)
    }
  }, [theme])

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (theme === 'system') setThemeState('system')
    }
    try {
      m?.addEventListener?.('change', onChange)
    } catch {}
    return () => {
      try {
        m?.removeEventListener?.('change', onChange)
      } catch {}
    }
  }, [theme])

  return { theme, setTheme } as const
}
