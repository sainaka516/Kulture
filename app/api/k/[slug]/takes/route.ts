import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    console.log('Fetching takes for community:', params.slug)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // First, get the community to check if it's a parent or child
    const community = await prisma.community.findUnique({
      where: { slug: params.slug },
      include: {
        parent: true,
        children: {
          select: {
            id: true
          }
        }
      }
    })

    if (!community) {
      console.error('Community not found:', params.slug)
      return new NextResponse('Community not found', { status: 404 })
    }

    console.log('Found community:', {
      id: community.id,
      name: community.name,
      isParent: !community.parent,
      childrenCount: community.children.length,
      childIds: community.children.map(c => c.id)
    })

    // Get all child community IDs
    const childIds = community.children.map(child => child.id)

    // Get takes from both parent and children
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

    console.log('Found takes:', {
      count: takes.length,
      takes: takes.map(t => ({
        id: t.id,
        title: t.title,
        communityId: t.communityId,
        communityName: t.community.name,
        parentCommunityName: t.community.parent?.name
      }))
    })

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

    console.log('Transformed takes:', {
      count: transformedTakes.length,
      takes: transformedTakes.map(t => ({
        id: t.id,
        title: t.title,
        communityId: t.communityId,
        communityName: t.community.name,
        parentCommunityName: t.community.parent?.name,
        upvotes: t._count.upvotes,
        downvotes: t._count.downvotes
      }))
    })

    return NextResponse.json(transformedTakes)
  } catch (error) {
    console.error('Error fetching takes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 