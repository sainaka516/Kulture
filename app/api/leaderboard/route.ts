import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Get all takes with their vote counts and community member counts
    const takes = await prisma.take.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
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
          },
        },
        votes: true,
      },
    })

    // Calculate verified takes for each user
    const userPoints = takes.reduce((acc, take) => {
      const upvotes = take.votes.filter(vote => vote.type === 'UP').length
      const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length
      const voteScore = upvotes - downvotes
      
      // Get all communities to check (current and parent chain)
      const communitiesToCheck = []
      
      // Add current community
      if (take.community._count?.members) {
        communitiesToCheck.push({
          name: take.community.name,
          memberCount: take.community._count.members
        })
      }

      // Add parent communities
      let parentCommunity = take.community.parent
      while (parentCommunity) {
        if (parentCommunity._count?.members) {
          communitiesToCheck.push({
            name: parentCommunity.name,
            memberCount: parentCommunity._count.members
          })
        }
        parentCommunity = parentCommunity.parent
      }

      // Calculate verifications
      const verifiedCommunities = communitiesToCheck.filter(community => {
        const requiredVotes = Math.ceil(community.memberCount * 0.5)
        return voteScore >= requiredVotes
      })

      const totalPoints = verifiedCommunities.length

      if (totalPoints > 0) {
        const userId = take.author.id
        acc[userId] = acc[userId] || {
          id: userId,
          name: take.author.name,
          username: take.author.username,
          image: take.author.image,
          points: 0,
          verifiedTakes: 0,
          multiVerifiedTakes: 0,
          totalVerifications: 0,
          maxVerificationsOnSingleTake: 0
        }

        // Update user stats
        acc[userId].points += totalPoints
        acc[userId].verifiedTakes += 1
        acc[userId].totalVerifications += totalPoints
        
        // Update multi-verification stats
        if (totalPoints > 1) {
          acc[userId].multiVerifiedTakes += 1
        }
        
        // Track the highest number of verifications on a single take
        if (totalPoints > acc[userId].maxVerificationsOnSingleTake) {
          acc[userId].maxVerificationsOnSingleTake = totalPoints
        }

        // Debug logging
        console.log(`Take ${take.id} by user ${userId}:`, {
          upvotes,
          downvotes,
          voteScore,
          verifiedCommunities: verifiedCommunities.map(c => c.name),
          totalPoints,
          userStats: acc[userId]
        })
      }

      return acc
    }, {} as Record<string, {
      id: string
      name: string | null
      username: string
      image: string | null
      points: number
      verifiedTakes: number
      multiVerifiedTakes: number
      totalVerifications: number
      maxVerificationsOnSingleTake: number
    }>)

    // Convert to array and sort by points
    const leaderboard = Object.values(userPoints).sort((a, b) => b.points - a.points)

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 