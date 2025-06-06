import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // First get the community by slug
    const community = await prisma.community.findUnique({
      where: {
        slug: params.slug,
      },
      include: {
        children: {
          select: {
            id: true
          }
        }
      }
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    // Get all child community IDs
    const childIds = community.children.map(child => child.id)
    
    // Fetch takes from both parent and child communities
    const takes = await prisma.take.findMany({
      where: {
        communityId: {
          in: [community.id, ...childIds]
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
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
                members: true,
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
          },
        },
        votes: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(takes)
  } catch (error) {
    console.error('[COMMUNITY_TAKES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 