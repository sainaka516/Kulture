import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set',
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set'
    }

    return NextResponse.json({
      status: 'success',
      environment: envCheck,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[DEBUG-ENV] Error:', error)
    return NextResponse.json({
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 