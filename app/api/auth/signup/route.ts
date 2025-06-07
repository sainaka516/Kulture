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
      return new NextResponse(
        JSON.stringify({
          error: 'User with this email or username already exists'
        }),
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    })
  } catch (error) {
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
} 