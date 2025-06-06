import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    const { type } = json

    if (!type || !['UP', 'DOWN'].includes(type)) {
      return new NextResponse('Invalid vote type', { status: 400 })
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_takeId: {
          userId: session.user.id,
          takeId: params.id,
        },
      },
    })

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await prisma.vote.delete({
          where: {
            userId_takeId: {
              userId: session.user.id,
              takeId: params.id,
            },
          },
        })
      } else {
        // Update vote if different type
        await prisma.vote.update({
          where: {
            userId_takeId: {
              userId: session.user.id,
              takeId: params.id,
            },
          },
          data: {
            type,
          },
        })
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          type,
          userId: session.user.id,
          takeId: params.id,
        },
      })
    }

    const take = await prisma.take.findUnique({
      where: {
        id: params.id,
      },
      include: {
        votes: true,
      },
    })

    return NextResponse.json(take)
  } catch (error) {
    console.error('Failed to vote on take:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 