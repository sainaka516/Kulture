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
    console.log('🚀 Starting request for kulture:', params.slug)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // First, get the community with full hierarchy
    const community = await prisma.community.findUnique({
      where: { slug: params.slug },
      include: {
        parent: {
          include: {
            parent: true
          }
        },
        children: {
          include: {
            children: {
              include: {
                takes: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            },
            takes: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        takes: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!community) {
      console.error('❌ Community not found:', params.slug)
      return new NextResponse('Community not found', { status: 404 })
    }

    console.log('📁 Found community hierarchy:', {
      name: community.name,
      id: community.id,
      parentKulture: community.parent?.name,
      grandparentKulture: community.parent?.parent?.name,
      directTakes: community.takes.length,
      children: community.children.map(c => ({
        name: c.name,
        takes: c.takes.length,
        children: c.children.map(gc => ({
          name: gc.name,
          takes: gc.takes.length
        }))
      }))
    })

    // Get all descendant community IDs using recursive CTE
    const descendantIds = await getAllDescendantIds(community.id)
    const allRelevantIds = [community.id, ...descendantIds]

    console.log('🎯 Will fetch takes from these communities:', {
      currentKulture: community.name,
      communityIds: allRelevantIds
    })

    // Get takes from parent and all descendants
    const takes = await prisma.take.findMany({
      where: {
        communityId: { in: allRelevantIds }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            verified: true,
            image: true
          }
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
            comments: true,
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Log the takes we found grouped by community
    const takesByKulture = takes.reduce((acc, take) => {
      const kultureName = take.community.name
      if (!acc[kultureName]) {
        acc[kultureName] = []
      }
      acc[kultureName].push({
        id: take.id,
        title: take.title
      })
      return acc
    }, {} as Record<string, Array<{ id: string, title: string }>>)

    console.log('📝 Takes found by Kulture:', takesByKulture)

    // Transform takes to include vote information
    const transformedTakes = takes.map(take => ({
      ...take,
      _count: {
        ...take._count,
        upvotes: take.votes.filter(vote => vote.type === 'UP').length,
        downvotes: take.votes.filter(vote => vote.type === 'DOWN').length,
      },
      currentUserId: userId,
      userVote: userId 
        ? take.votes.find(vote => vote.userId === userId)?.type || null
        : null
    }))

    console.log('✨ Final take count:', transformedTakes.length)
    return NextResponse.json(transformedTakes)
  } catch (error) {
    console.error('❌ Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 