import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/auth'

export async function middleware(request: NextRequest) {
  // Update user's auth session and get the user session
  const { supabaseResponse, user } = await updateSession(request)

  const PROTECTED_PATHS = ['/sportsbook', '/profile', '/profile/*', '/sportsbook/*']

  if (PROTECTED_PATHS.includes(request.nextUrl.pathname) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users from the home page to /sportsbook
  if (request.nextUrl.pathname === '/' && user) {
    return NextResponse.redirect(new URL('/sportsbook', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
