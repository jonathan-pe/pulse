import { useAuth } from '@clerk/clerk-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Custom hook for authenticated API calls
 * Automatically injects Clerk session token into requests
 *
 * @example
 * const fetchAPI = useAuthenticatedFetch()
 * const data = await fetchAPI<MyType>('/endpoint', { method: 'POST', body: ... })
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth()

  return async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
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
  }
}
