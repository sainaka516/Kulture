import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that don't require authentication
const publicPaths = [
  '/sign-in',
  '/signup',
  '/api/auth',
  '/api/debug-env',
  '/api/auth/test',
  '/_next',
  '/images',
  '/favicon.ico',
  '/manifest.json',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow authentication-related paths
  if (pathname.startsWith('/api/auth')) {
    console.log('[MIDDLEWARE] Allowing auth route:', pathname)
    return NextResponse.next()
  }

  // Allow session check route
  if (pathname === '/api/auth/session') {
    console.log('[MIDDLEWARE] Allowing session check route')
    return NextResponse.next()
  }

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if it's an API request
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next()

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      })
    }

    return response
  }

  // For all other routes, check authentication
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    // If not authenticated, redirect to sign-in page
    if (!token) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Error checking authentication:', error)
    // If there's an error checking auth, redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/* (Next.js internals)
     * 3. /images/* (static files)
     * 4. /favicon.ico (favicon file)
     * 5. /manifest.json (web manifest)
     * 6. /api/debug-env (debug route)
     * 7. /api/auth/test (auth test route)
     */
    '/((?!api/auth|_next|images|favicon.ico|manifest.json).*)',
  ],
} 