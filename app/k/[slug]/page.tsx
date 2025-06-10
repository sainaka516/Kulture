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
        include: {
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

  // Get the current user's session
  const session = await getServerSession(authOptions)

  // Transform the takes with proper vote counts
  const transformedTakes = takes.map(take => {
    // Calculate vote counts
    const upvotes = take.votes.filter(vote => vote.type === 'UP').length
    const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length

    return {
      ...transformTake(take, session?.user?.id),
      _count: {
        ...take._count,
        upvotes,
        downvotes,
      },
      community: {
        id: take.community.id,
        name: take.community.name,
        slug: take.community.slug,
        parent: take.community.parent ? {
          id: take.community.parent.id,
          name: take.community.parent.name,
          slug: take.community.parent.slug,
          _count: {
            members: take.community.parent._count?.members || 0,
            takes: take.community.parent._count?.takes || 0,
            children: take.community.parent._count?.children || 0,
          }
        } : null,
        _count: {
          members: take.community._count?.members || 0,
          takes: take.community._count?.takes || 0,
          children: take.community._count?.children || 0,
        }
      }
    }
  })

  // Prepare the full community data
  const fullCommunity = {
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    owner: {
      id: community.owner.id,
      name: community.owner.name,
      image: community.owner.image
    },
    parent: community.parent ? {
      id: community.parent.id,
      name: community.parent.name,
      slug: community.parent.slug,
      _count: {
        members: community.parent._count?.members || 0,
        takes: community.parent._count?.takes || 0,
        children: community.parent._count?.children || 0,
      }
    } : null,
    children: community.children.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      _count: {
        members: c._count?.members || 0,
        takes: c._count?.takes || 0,
        children: c._count?.children || 0,
      }
    })),
    _count: {
      members: community._count?.members || 0,
      takes: community._count?.takes || 0,
      children: community._count?.children || 0,
    }
  }

  return <CommunityClient community={{ ...fullCommunity, takes: transformedTakes }} />
} 