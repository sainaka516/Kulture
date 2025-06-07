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

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        take: {
          select: {
            id: true,
            title: true,
          },
        },
        from: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { notificationIds } = await req.json()

    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { type, takeId } = await req.json()

    // For vote notifications, get the take's author
    if (type === 'TAKE_UPVOTED' || type === 'TAKE_DOWNVOTED') {
      const take = await prisma.take.findUnique({
        where: { id: takeId },
        select: { authorId: true },
      })

      if (!take) {
        return new NextResponse('Take not found', { status: 404 })
      }

      // Don't create notification if the user is voting on their own take
      if (take.authorId === session.user.id) {
        return NextResponse.json({ success: true })
      }

      // Create the notification
      const notification = await prisma.notification.create({
        data: {
          type,
          userId: take.authorId,
          takeId,
          fromId: session.user.id,
        },
      })

      return NextResponse.json(notification)
    }

    return new NextResponse('Invalid notification type', { status: 400 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 