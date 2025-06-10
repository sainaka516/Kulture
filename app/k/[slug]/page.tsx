import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import CommunityClient from './community-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Get all descendant IDs using a recursive CTE query
async function getAllDescendantIds(communityId: string): Promise<string[]> {
  console.log('🔍 Getting descendants for community:', communityId)
  
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

interface CommunityPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      description: true,
    },
  })

  if (!community) return {}

  return {
    title: `${community.name} - Kulture`,
    description: community.description || `Welcome to ${community.name} on Kulture`,
  }
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  console.log('Loading community page for:', params.slug)

  // First get the community to check if it's a parent or child
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      parent: {
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              members: true
            }
          }
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
              _count: {
                select: {
                  members: true,
                  takes: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              takes: true,
              children: true
            }
          }
        }
      }
    }
  })

  if (!community) {
    console.error('Community not found:', params.slug)
    notFound()
  }

  console.log('Initial community fetch:', {
    id: community.id,
    name: community.name,
    isParent: !community.parent,
    childrenCount: community.children.length,
    children: community.children.map(c => ({
      name: c.name,
      grandchildren: c.children?.map(gc => gc.name)
    }))
  })

  // Get all descendant community IDs using recursive CTE
  const descendantIds = await getAllDescendantIds(community.id)
  const allRelevantIds = [community.id, ...descendantIds]

  console.log('Will fetch takes from communities:', {
    currentKulture: community.name,
    communityIds: allRelevantIds
  })
  
  // Get the full community data including takes
  const fullCommunity = await prisma.community.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      parent: {
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              members: true
            }
          }
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: {
              members: true,
              takes: true,
              children: true
            }
          }
        }
      },
      _count: {
        select: {
          members: true,
          takes: true,
          children: true
        }
      }
    }
  })

  if (!fullCommunity) {
    console.error('Full community data not found:', params.slug)
    notFound()
  }

  // Fetch takes from parent and all descendants
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

  console.log('Takes found by Kulture:', takesByKulture)

  // Get the current user's session
  const session = await getServerSession(authOptions)

  // Transform takes to include vote information
  const transformedTakes = takes.map(take => ({
    id: take.id,
    title: take.title,
    content: take.content,
    createdAt: take.createdAt.toISOString(),
    author: {
      id: take.author.id,
      name: take.author.name,
      username: take.author.username,
      image: take.author.image,
      verified: take.author.verified
    },
    community: {
      id: take.community.id,
      name: take.community.name,
      slug: take.community.slug,
      parent: take.community.parent ? {
        id: take.community.parent.id,
        name: take.community.parent.name,
        slug: take.community.parent.slug,
        _count: take.community.parent._count
      } : null,
      _count: take.community._count
    },
    _count: {
      ...take._count,
      upvotes: take.votes.filter(vote => vote.type === 'UP').length,
      downvotes: take.votes.filter(vote => vote.type === 'DOWN').length,
    },
    currentUserId: session?.user?.id,
    userVote: session?.user?.id
      ? (take.votes.find(vote => vote.userId === session.user.id)?.type || null) as "UP" | "DOWN" | null
      : null,
    votes: take.votes.map(vote => ({
      id: vote.id,
      type: vote.type as "UP" | "DOWN",
      userId: vote.userId
    }))
  }))

  return <CommunityClient community={{ ...fullCommunity, takes: transformedTakes }} />
} 