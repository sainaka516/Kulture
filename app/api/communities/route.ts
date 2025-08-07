import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const communities = await db.community.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
              }
            }
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            children: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        },
        _count: {
          select: {
            takes: true,
            members: true,
            children: true,
          },
        },
      },
    })

    // Format the communities to show proper hierarchy
    const formattedCommunities = communities.map(community => {
      let displayName = community.name
      
      // If it has a parent, show the full hierarchy
      if (community.parent) {
        if (community.parent.parent) {
          // It's a child of a child
          displayName = `${community.parent.parent.name} > ${community.parent.name} > ${community.name}`
        } else {
          // It's a direct child
          displayName = `${community.parent.name} > ${community.name}`
        }
      }
      
      return {
        ...community,
        displayName
      }
    })

    return NextResponse.json(formattedCommunities)
  } catch (error) {
    console.error('[COMMUNITIES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[COMMUNITIES_POST] Session:', session)
    
    if (!session?.user) {
      console.log('[COMMUNITIES_POST] No session user')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!session.user.email) {
      console.log('[COMMUNITIES_POST] No user email in session')
      return new NextResponse('User email not found', { status: 400 })
    }

    // First, verify the user exists in the database
    const user = await db.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    console.log('[COMMUNITIES_POST] Found user:', user)

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await req.json()
    console.log('[COMMUNITIES_POST] Request body:', body)
    
    const { name, title, description, rules, parentId } = body

    if (!name || !title) {
      return new NextResponse('Name and title are required', { status: 400 })
    }

    // Generate a URL-friendly slug from the name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if community name or slug is already taken
    const existingCommunity = await db.community.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    })

    if (existingCommunity) {
      return new NextResponse(
        'A community with this name already exists',
        { status: 400 }
      )
    }

    // Create the community
    const communityData: any = {
      name,
      slug,
      title,
      description: description || null,
      rules: rules || null,
      owner: {
        connect: {
          id: user.id
        }
      }
    }

    // Only add parent relation if parentId is provided
    if (parentId) {
      const parentCommunity = await db.community.findUnique({
        where: { id: parentId }
      })

      if (!parentCommunity) {
        return new NextResponse(
          'Parent community not found',
          { status: 400 }
        )
      }

      communityData.parent = {
        connect: {
          id: parentId
        }
      }
    }

    console.log('[COMMUNITIES_POST] Creating community with data:', communityData)

    // First create the community
    const community = await db.community.create({
      data: communityData
    })

    // Then create the community member record
    await db.communityMember.create({
      data: {
        userId: user.id,
        communityId: community.id,
        role: 'OWNER'
      }
    })

    // Finally fetch the community with all related data
    const fullCommunity = await db.community.findUnique({
      where: { id: community.id },
      include: {
        parent: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            takes: true,
            members: true,
            children: true
          }
        }
      }
    })

    console.log('[COMMUNITIES_POST] Created community:', fullCommunity)

    return NextResponse.json(fullCommunity)
  } catch (error) {
    console.error('[COMMUNITIES_POST] Error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new NextResponse('A community with this name already exists', { status: 400 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
} 