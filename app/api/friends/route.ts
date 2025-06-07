import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const friends = await prisma.friendship.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          }
        }
      }
    })

    return NextResponse.json(friends.map(f => f.friend))
  } catch (error) {
    console.error('Error fetching friends:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 