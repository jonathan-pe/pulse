import { NextResponse, type NextRequest } from 'next/server'
import { fetcher } from '@/utils/serverFetcher'

interface UpdateSessionResponse {
  supabaseResponse: NextResponse
  user: any | null
}

export async function updateSession(request: NextRequest): Promise<UpdateSessionResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Extract the session and refresh tokens from cookies
  const sessionTokenCookie = request.cookies.get('session_token')
  const refreshTokenCookie = request.cookies.get('refresh_token')

  if (!sessionTokenCookie?.value || !refreshTokenCookie?.value) {
    return { supabaseResponse, user: null }
  }

  try {
    // Verify the session with the custom backend
    const { user } = await fetcher(`${process.env.BACKEND_URL}/auth/verify-session`, {
      method: 'POST',
    })

    return { supabaseResponse, user }
  } catch (error) {
    console.log(error)
    // If the session token is expired, try to refresh it
    try {
      const { access_token, refresh_token } = await refreshToken()

      // Set the new tokens in cookies
      supabaseResponse.cookies.set('session_token', access_token, { path: '/', httpOnly: true })
      supabaseResponse.cookies.set('refresh_token', refresh_token, { path: '/', httpOnly: true })

      // Verify the session again with the new access token
      const { user } = await fetcher(`${process.env.BACKEND_URL}/auth/verify-session`, {
        method: 'POST',
      })

      return { supabaseResponse, user }
    } catch (refreshError) {
      return { supabaseResponse, user: null }
    }
  }
}

interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
}

export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  const { access_token, refresh_token } = await fetcher(`${process.env.BACKEND_URL}/auth/refresh-token`, {
    method: 'POST',
  })

  return { access_token, refresh_token }
}
