import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get all takes with their vote counts and community member counts
    const takes = await prisma.take.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            image: true,
            verified: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                members: true,
              },
            },
            parent: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
          },
        },
        votes: true,
      },
    })

    // Calculate verified takes for each user
    const userPoints = takes.reduce((acc, take) => {
      const upvotes = take.votes.filter(vote => vote.type === 'UP').length
      
      // Check verification in current community
      const isVerifiedInCurrent = take.community._count?.members 
        ? upvotes >= Math.ceil(take.community._count.members * 0.5)
        : false

      // Check verification in parent community if it exists
      const isVerifiedInParent = take.community.parent?._count?.members 
        ? upvotes >= Math.ceil(take.community.parent._count.members * 0.5)
        : false

      // Calculate points for this take
      const pointsForTake = (isVerifiedInCurrent ? 1 : 0) + (isVerifiedInParent ? 1 : 0)

      if (pointsForTake > 0) {
        const userId = take.author.id
        acc[userId] = acc[userId] || {
          id: userId,
          username: take.author.username,
          image: take.author.image,
          points: 0,
          verifiedTakes: 0,
          multiVerifiedTakes: 0,
        }
        acc[userId].points += pointsForTake
        acc[userId].verifiedTakes += 1
        if (pointsForTake > 1) {
          acc[userId].multiVerifiedTakes += 1
        }
      }

      return acc
    }, {} as Record<string, {
      id: string
      username: string | null
      image: string | null
      points: number
      verifiedTakes: number
      multiVerifiedTakes: number
    }>)

    // Convert to array and sort by points
    const leaderboard = Object.values(userPoints).sort((a, b) => b.points - a.points)

    // Find user's rank
    const userRank = leaderboard.findIndex(user => user.id === params.userId) + 1

    return NextResponse.json({ rank: userRank > 0 ? userRank : null })
  } catch (error) {
    console.error('Error fetching user rank:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 