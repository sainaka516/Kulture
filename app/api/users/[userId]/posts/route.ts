import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const posts = await db.post.findMany({
      where: {
        authorId: params.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: true,
        community: true,
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('[USER_POSTS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 