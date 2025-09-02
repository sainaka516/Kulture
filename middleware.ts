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
  '/api/test-db',
  '/api/test-user',
  '/_next',
  '/images',
  '/favicon.ico',
  '/manifest.json',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow authentication-related paths
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow session check route
  if (pathname === '/api/auth/session') {
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

  // Only check authentication for page routes, not API calls or static files
  if (pathname.includes('.') || pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // For page routes, check authentication
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
     * Match only page routes, not API routes or static files
     */
    '/((?!api|_next|images|favicon.ico|manifest.json).*)',
  ],
} 