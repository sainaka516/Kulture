import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // 'all', 'users', 'kultures', 'takes'

    // Get the current user's session
    const session = await getServerSession(authOptions)

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const searchResults: any = {
      users: [],
      kultures: [],
      takes: []
    }

    // Only search requested types or all if not specified
    if (type === 'all' || type === 'users') {
      searchResults.users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        take: 5,
      })
    }

    if (type === 'all' || type === 'kultures') {
      searchResults.kultures = await prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          _count: {
            select: {
              members: true,
              takes: true,
            },
          },
        },
        take: 5,
      })
    }

    if (type === 'all' || type === 'takes') {
      const takes = await prisma.take.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          communityId: true,
          authorId: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              verified: true
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              _count: {
                select: {
                  members: true
                }
              },
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  _count: {
                    select: {
                      members: true
                    }
                  },
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      _count: {
                        select: {
                          members: true
                        }
                      }
                    }
                  }
                }
              },
              children: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  _count: {
                    select: {
                      members: true
                    }
                  }
                }
              }
            },
          },
          votes: true,
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Transform takes to include currentUserId and userVote
      searchResults.takes = takes.map(take => ({
        ...take,
        currentUserId: session?.user?.id,
        userVote: session?.user?.id 
          ? take.votes.find(vote => vote.userId === session.user.id)?.type || null
          : null,
        _count: {
          ...take._count,
          upvotes: take.votes.filter(vote => vote.type === 'UP').length,
          downvotes: take.votes.filter(vote => vote.type === 'DOWN').length
        }
      }))
    }

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 })
  }
} 