import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import CommunityClient from './community-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    title: `k/${community.name} - Kulture`,
    description: community.description || `Welcome to k/${community.name} on Kulture`,
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
    childIds: community.children.map(c => c.id)
  })

  // Get all child community IDs
  const childIds = community.children.map(child => child.id)
  
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

  // Fetch takes separately to include both parent and child takes
  const takes = await prisma.take.findMany({
    where: {
      OR: [
        { communityId: community.id },
        { communityId: { in: childIds } }
      ]
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

  // Get the current user's session
  const session = await getServerSession(authOptions)

  // Transform takes to include vote information
  const transformedTakes = takes.map(take => ({
    ...take,
    _count: {
      ...take._count,
      upvotes: take.votes.filter(vote => vote.type === 'UP').length,
      downvotes: take.votes.filter(vote => vote.type === 'DOWN').length
    },
    currentUserId: session?.user?.id,
    userVote: session?.user?.id 
      ? take.votes.find(vote => vote.userId === session.user.id)?.type || null
      : null
  }))

  // Return the client component with the full community data
  return (
    <CommunityClient
      community={{
        ...fullCommunity,
        takes: transformedTakes
      }}
    />
  )
} 