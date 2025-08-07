import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Get friend requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const requests = await db.friendRequest.findMany({
      where: {
        receiverId: session.user.id,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          }
        }
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// Send friend request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { receiverId } = await request.json()

    // Check if request already exists
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId },
          { senderId: receiverId, receiverId: session.user.id }
        ]
      }
    })

    if (existingRequest) {
      return new NextResponse('Friend request already exists', { status: 400 })
    }

    // Check if already friends
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: receiverId },
          { userId: receiverId, friendId: session.user.id }
        ]
      }
    })

    if (existingFriendship) {
      return new NextResponse('Already friends', { status: 400 })
    }

    const friendRequest = await db.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId
      }
    })

    return NextResponse.json(friendRequest)
  } catch (error) {
    console.error('Error sending friend request:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 