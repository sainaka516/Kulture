import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Get all descendant IDs using a recursive CTE query
async function getAllDescendantIds(communityId: string): Promise<string[]> {
  console.log('🔍 Starting descendant search for community:', communityId)
  
  try {
    // Use Prisma's $queryRaw to execute a recursive CTE query
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE descendants AS (
        -- Base case: direct children
        SELECT id, name, "parentId", 1 as level
        FROM "Community"
        WHERE "parentId" = ${communityId}
        
        UNION ALL
        
        -- Recursive case: children of children
        SELECT c.id, c.name, c."parentId", d.level + 1
        FROM "Community" c
        INNER JOIN descendants d ON c."parentId" = d.id
      )
      SELECT DISTINCT id FROM descendants;
    `

    console.log('✅ Found descendants:', result)
    return result.map(r => r.id)
  } catch (error) {
    console.error('❌ Error finding descendants:', error)
    throw error
  }
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get the community
    const community = await prisma.community.findUnique({
      where: { slug: params.slug },
      include: {
        parent: {
          include: {
            parent: {
              include: {
                parent: true,
                _count: {
                  select: {
                    members: true
                  }
                }
              },
              _count: {
                select: {
                  members: true
                }
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    // Get takes for the community
    const takes = await prisma.take.findMany({
      where: {
        communityId: community.id
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            verified: true
          }
        },
        community: {
          include: {
            parent: {
              include: {
                parent: {
                  include: {
                    parent: true,
                    _count: {
                      select: {
                        members: true
                      }
                    }
                  },
                  _count: {
                    select: {
                      members: true
                    }
                  }
                },
                _count: {
                  select: {
                    members: true
                  }
                }
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        votes: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    // Transform takes to include currentUserId and userVote
    const transformedTakes = takes.map(take => ({
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

    return NextResponse.json({
      takes: transformedTakes,
      nextCursor: takes.length === limit ? takes[takes.length - 1].id : undefined
    })
  } catch (error) {
    console.error('[COMMUNITY_TAKES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 
  }
} 