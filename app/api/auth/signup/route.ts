import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import * as z from 'zod'

// Define validation schema
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[SIGNUP] Received signup request:', { 
      username: body.username,
      email: body.email,
      hasPassword: !!body.password,
      hasConfirmPassword: !!body.confirmPassword
    })
    
    // Remove confirmPassword before validation
    const { confirmPassword, ...signupData } = body

    // Validate password match
    if (signupData.password !== confirmPassword) {
      console.log('[SIGNUP] Password mismatch')
      return new NextResponse(
        JSON.stringify({
          error: 'Passwords do not match'
        }),
        { status: 400 }
      )
    }

    try {
      const { username, email, password } = signupSchema.parse(signupData)
      console.log('[SIGNUP] Validation passed:', { username, email })
    } catch (validationError) {
      console.log('[SIGNUP] Validation failed:', validationError)
      if (validationError instanceof z.ZodError) {
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid input',
            details: validationError.errors,
          }),
          { status: 400 }
        )
      }
      throw validationError
    }

    // Check if username is taken
    const existingUsername = await db.user.findUnique({
      where: { username: signupData.username.toLowerCase() }
    })

    if (existingUsername) {
      console.log('[SIGNUP] Username already exists:', { username: signupData.username })
      return new NextResponse(
        JSON.stringify({
          error: 'Username already taken'
        }),
        { status: 409 }
      )
    }

    // Check if email is taken
    const existingEmail = await db.user.findUnique({
      where: { email: signupData.email.toLowerCase() }
    })

    if (existingEmail) {
      console.log('[SIGNUP] Email already exists:', { email: signupData.email })
      return new NextResponse(
        JSON.stringify({
          error: 'Email already registered'
        }),
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(signupData.password, salt)
    console.log('[SIGNUP] Password hashed successfully:', { 
      passwordLength: signupData.password.length,
      hashLength: hashedPassword.length 
    })

    // Create user with explicit data
    const userData = {
      username: signupData.username.toLowerCase(),
      email: signupData.email.toLowerCase(),
      password: hashedPassword,
      verified: false,
      name: signupData.username,
    }

    console.log('[SIGNUP] Creating user with data:', {
      ...userData,
      password: '[HIDDEN]'
    })

    const user = await db.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        verified: true
      }
    })

    console.log('[SIGNUP] User created successfully:', { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      name: user.name,
      verified: user.verified
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('[SIGNUP] Error during signup:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
    })
    
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid input',
          details: error.errors,
        }),
        { status: 400 }
      )
    }

    // Check for Prisma errors
    if (error instanceof Error && error.message.includes('prisma')) {
      console.error('[SIGNUP] Prisma error:', {
        error: error.message,
        code: (error as any).code,
        meta: (error as any).meta
      })
    }

    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown'
      }),
      { status: 500 }
    )
  }
} 