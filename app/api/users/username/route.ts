import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { username } = await request.json()

    // Validate username
    if (!username || typeof username !== 'string') {
      return new NextResponse('Invalid username', { status: 400 })
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return new NextResponse('Username already taken', { status: 400 })
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating username:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 