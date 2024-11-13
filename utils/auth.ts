import { NextResponse, type NextRequest } from 'next/server'
import { fetcher } from '@/utils/serverFetcher'
import { Session, User } from '@/types/supabase'

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

  if (sessionTokenCookie?.value) {
    try {
      // Verify the session with the custom backend
      const { user } = await fetcher(`${process.env.BACKEND_URL}/auth/verify-session`, {
        method: 'POST',
      })

      return { supabaseResponse, user }
    } catch (error) {
      return { supabaseResponse, user: null }
    }
  }

  if (refreshTokenCookie?.value) {
    try {
      // Try to refresh the session with the refresh token
      const { user, session }: { user: User; session: Session } = await fetcher(
        `${process.env.BACKEND_URL}/auth/refresh-token`,
        {
          method: 'POST',
        }
      )

      /* Setting client session cookies automatically doesn't work in middleware 
        since it's server to server so we need to set them manually through
        supabase and the response
        
        maxAge is seconds here but ms in node/express */

      supabaseResponse.cookies.set('session_token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: session.expires_in,
      })

      supabaseResponse.cookies.set('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
      })

      return { supabaseResponse, user }
    } catch (error) {
      return { supabaseResponse, user: null }
    }
  }

  return { supabaseResponse, user: null }
}
