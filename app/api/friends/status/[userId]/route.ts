import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { userId } = params

    // Check if they are already friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: userId },
          { userId: userId, friendId: session.user.id }
        ]
      }
    })

    if (friendship) {
      return NextResponse.json({ status: 'FRIENDS' })
    }

    // Check if there's a pending friend request
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id }
        ],
        status: 'PENDING'
      }
    })

    if (friendRequest) {
      return NextResponse.json({ 
        status: 'PENDING',
        isSender: friendRequest.senderId === session.user.id
      })
    }

    return NextResponse.json({ status: 'NONE' })
  } catch (error) {
    console.error('Error checking friendship status:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 