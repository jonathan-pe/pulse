import { PulseError } from '@/types/error'
import { cookies } from 'next/headers'

export const fetcher = async (url: string, { method = 'GET', headers, body }: RequestInit) => {
  const cookiesStore = await cookies()

  const res = await fetch(url, {
    method,
    headers: { Cookie: cookiesStore.toString(), 'Content-Type': 'application/json', ...headers },
    body,
    credentials: 'include',
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new PulseError(error.message ?? 'An error occurred', error.description ?? 'Please try again.', res.status)
  }

  return res.json()
}
