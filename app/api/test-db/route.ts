import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('[TEST-DB] Testing database connection...')
    
    // Test basic database connection
    const userCount = await db.user.count()
    console.log('[TEST-DB] User count:', userCount)
    
    // Test finding a specific user
    const testUser = await db.user.findFirst({
      select: { id: true, username: true, email: true }
    })
    console.log('[TEST-DB] Test user:', testUser)
    
    return NextResponse.json({
      status: 'success',
      userCount,
      testUser,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TEST-DB] Database error:', error)
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 