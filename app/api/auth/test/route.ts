import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    return NextResponse.json({
      status: 'success',
      hasToken: !!token,
      tokenData: token ? {
        id: token.id,
        username: token.username,
        email: token.email,
        verified: token.verified
      } : null,
      environment: {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[AUTH-TEST] Error:', error)
    return NextResponse.json({
      error: 'Failed to check authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
