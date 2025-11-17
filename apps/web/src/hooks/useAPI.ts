import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * React hook for authenticated API calls
 * Automatically injects Clerk session token into requests
 *
 * @example
 * ```tsx
 * const fetchAPI = useAPI()
 * const { data } = useQuery({
 *   queryKey: queryKeys.games.upcoming(),
 *   queryFn: () => fetchAPI<Game[]>('/games/upcoming'),
 * })
 * ```
 */
export function useAPI() {
  const { getToken } = useAuth()

  return useCallback(
    async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
      const token = await getToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
    [getToken]
  )
}
