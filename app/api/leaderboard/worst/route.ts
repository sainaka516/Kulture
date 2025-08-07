import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all takes with their votes and authors
    const worstTakes = await db.take.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        votes: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate vote scores and sort by most downvotes
    const processedTakes = worstTakes
      .map(take => {
        const upvotes = take.votes.filter(vote => vote.type === 'UP').length
        const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length
        const score = upvotes - downvotes

        return {
          ...take,
          score,
          upvotes,
          downvotes,
        }
      })
      .filter(take => take.downvotes > 0) // Only include takes with downvotes
      .sort((a, b) => b.downvotes - a.downvotes) // Sort by most downvotes
      .slice(0, 50) // Limit to top 50 worst takes

    return NextResponse.json(processedTakes)
  } catch (error) {
    console.error('Error fetching worst takes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 