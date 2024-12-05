import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (Auth API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api/auth/*|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const PROTECTED_PATHS = ['/sportsbook', '/profile']

export default async function middleware(req: NextRequest) {
  const session = await auth()
  const { pathname } = req.nextUrl

  // Check if the request path is protected
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    // Check if the user is authenticated
    if (!session) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', req.nextUrl.origin)
      return NextResponse.redirect(loginUrl)
    }
  } else {
    // Redirect to sportsbook if authenticated and trying to pages like login
    if (session) {
      const sportsbookUrl = new URL('/sportsbook', req.nextUrl.origin)
      return NextResponse.redirect(sportsbookUrl)
    }
  }

  return NextResponse.next()
}
