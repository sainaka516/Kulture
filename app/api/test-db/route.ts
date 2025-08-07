import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('[TEST-DB] Testing database connection...')
    console.log('[TEST-DB] DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('[TEST-DB] NODE_ENV:', process.env.NODE_ENV)
    
    // Test basic connection
    const result = await db.$queryRaw`SELECT 1 as test`
    console.log('[TEST-DB] Connection successful:', result)
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TEST-DB] Database connection failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
    })
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 