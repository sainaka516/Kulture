import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const community = await prisma.community.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        ownerId: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                image: true,
                verified: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    // Transform the data to only return user information and role
    const members = community.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.user.id === community.ownerId ? 'OWNER' : member.role,
      joinedAt: member.createdAt,
    }))

    return NextResponse.json(members)
  } catch (error) {
    console.error('[COMMUNITY_MEMBERS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 