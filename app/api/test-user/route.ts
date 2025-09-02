import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('[TEST-USER] Checking for user "sutich"...')
    
    // Test finding the user
    const user = await db.user.findUnique({
      where: { username: 'sutich' },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        password: true,
        verified: true
      }
    })
    
    console.log('[TEST-USER] User found:', !!user)
    
    if (user) {
      console.log('[TEST-USER] User details:', {
        id: user.id,
        username: user.username,
        email: user.email,
        hasPassword: !!user.password,
        verified: user.verified
      })
      
      // Test password if it exists
      if (user.password) {
        // Test with a common password to see if it matches
        const testPasswords = ['password', '123456', 'sutich', 'test']
        for (const testPass of testPasswords) {
          const isValid = await bcrypt.compare(testPass, user.password)
          if (isValid) {
            console.log('[TEST-USER] Password match found:', testPass)
            return NextResponse.json({
              status: 'success',
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                hasPassword: true,
                verified: user.verified
              },
              passwordHint: testPass,
              timestamp: new Date().toISOString()
            })
          }
        }
        console.log('[TEST-USER] No password match found')
      }
    }
    
    return NextResponse.json({
      status: 'success',
      user: user || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TEST-USER] Error:', error)
    return NextResponse.json({
      error: 'Failed to check user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
