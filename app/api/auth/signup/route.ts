'use client'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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
      hasPassword: !!body.password 
    })
    
    const { username, email, password } = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      console.log('[SIGNUP] User already exists:', { email, username })
      return new NextResponse(
        JSON.stringify({
          error: 'User with this email or username already exists'
        }),
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    console.log('[SIGNUP] Password hashed successfully')

    // Create user with explicit data
    const userData = {
      username: username.toLowerCase(), // Store username in lowercase
      email: email.toLowerCase(), // Store email in lowercase
      password: hashedPassword,
      verified: false, // Set verified to false by default
      name: username, // Set initial name to username
    }

    console.log('[SIGNUP] Creating user with data:', {
      ...userData,
      password: '[HIDDEN]'
    })

    const user = await prisma.user.create({
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

    // Verify the password hash works
    const verifyPassword = await bcrypt.compare(password, hashedPassword)
    console.log('[SIGNUP] Password verification test:', { 
      works: verifyPassword,
      passwordLength: password.length,
      hashLength: hashedPassword.length 
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
    console.error('[SIGNUP] Error during signup:', error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid input',
          details: error.errors,
        }),
        { status: 400 }
      )
    }

    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 