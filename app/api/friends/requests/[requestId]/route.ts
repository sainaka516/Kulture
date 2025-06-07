import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { status } = await request.json()

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.requestId }
    })

    if (!friendRequest) {
      return new NextResponse('Friend request not found', { status: 404 })
    }

    if (friendRequest.receiverId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (status === 'ACCEPTED') {
      // Create friendship records for both users and notification
      await prisma.$transaction([
        prisma.friendship.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          }
        }),
        prisma.friendship.create({
          data: {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          }
        }),
        prisma.friendRequest.update({
          where: { id: params.requestId },
          data: { status: 'ACCEPTED' }
        }),
        prisma.notification.create({
          data: {
            type: 'FRIEND_REQUEST_ACCEPTED',
            userId: friendRequest.senderId,
            fromId: session.user.id,
            read: false
          }
        })
      ])
    } else {
      // Update request status to REJECTED
      await prisma.friendRequest.update({
        where: { id: params.requestId },
        data: { status }
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error handling friend request:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 