import { auth } from '@/auth'

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
    '/((?!_next/static|_next/image|favicon.ico|api/auth/*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const PROTECTED_PATHS = ['/sportsbook', '/profile']

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Check if the request path is protected
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    // Check if the user is authenticated
    if (!req.auth) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', req.nextUrl.origin)
      return Response.redirect(loginUrl)
    }
  } else {
    // Redirect to sportsbook if authenticated and trying to pages like login
    if (req.auth) {
      const sportsbookUrl = new URL('/sportsbook', req.nextUrl.origin)
      return Response.redirect(sportsbookUrl)
    }
  }
})
