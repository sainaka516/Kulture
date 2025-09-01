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
  return handler(request)
} 