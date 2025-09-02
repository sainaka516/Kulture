import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

// Add some debugging
export async function GET(request: Request) {
  console.log('[AUTH-ROUTE] GET request received')
  return handler(request)
}

export async function POST(request: Request) {
  console.log('[AUTH-ROUTE] POST request received')
  const url = new URL(request.url)
  console.log('[AUTH-ROUTE] POST to:', url.pathname)
  
  try {
    const response = await handler(request)
    console.log('[AUTH-ROUTE] Response status:', response.status)
    return response
  } catch (error) {
    console.error('[AUTH-ROUTE] Error:', error)
    throw error
  }
} 