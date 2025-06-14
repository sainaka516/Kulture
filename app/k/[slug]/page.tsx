export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import CommunityClient from './community-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transformTake } from '@/lib/utils'

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

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function CommunityPage({ params }: PageProps) {
  // First get the community to check if it's a parent or child
  const community = await prisma.community.findUnique({
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

  if (!community) {
    console.error('Community not found:', params.slug)
    notFound()
  }

  // Log basic community info
  console.log('Community info:', {
    name: community.name,
    parent: community.parent?.name,
    childrenCount: community.children.length
  })

  // Get all descendant community IDs using recursive CTE
  const allRelevantIds = [community.id]

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
          },
          _count: {
            select: {
              members: true,
              takes: true,
              children: true
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

  // Get the session for user ID
  const session = await getServerSession(authOptions)

  // Transform takes to include user vote and counts
  const transformedTakes = takes.map(take => transformTake(take, session?.user?.id))

  return <CommunityClient community={{ ...community, takes: transformedTakes }} />
} 