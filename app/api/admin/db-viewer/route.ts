import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') || 'User'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Only allow viewing certain tables for security
    const allowedTables = ['User', 'Community', 'Take', 'Vote', 'Comment', 'Friendship', 'FriendRequest', 'Notification']
    
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ 
        error: 'Table not allowed',
        allowedTables 
      }, { status: 400 })
    }

    let data: any[] = []
    let count = 0

    switch (table) {
      case 'User':
        data = await db.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            verified: true,
            createdAt: true,
            _count: {
              select: {
                takes: true,
                communities: true,
                friends: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.user.count()
        break

      case 'Community':
        data = await db.community.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
            owner: {
              select: {
                username: true,
                name: true
              }
            },
            _count: {
              select: {
                members: true,
                takes: true,
                children: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.community.count()
        break

      case 'Take':
        data = await db.take.findMany({
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true
              }
            },
            community: {
              select: {
                name: true,
                slug: true
              }
            },
            _count: {
              select: {
                votes: true,
                comments: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.take.count()
        break

      case 'Vote':
        data = await db.vote.findMany({
          select: {
            id: true,
            type: true,
            createdAt: true,
            user: {
              select: {
                username: true
              }
            },
            take: {
              select: {
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.vote.count()
        break

      case 'Comment':
        data = await db.comment.findMany({
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                username: true
              }
            },
            take: {
              select: {
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.comment.count()
        break

      case 'Friendship':
        data = await db.friendship.findMany({
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                username: true
              }
            },
            friend: {
              select: {
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.friendship.count()
        break

      case 'FriendRequest':
        data = await db.friendRequest.findMany({
          select: {
            id: true,
            status: true,
            createdAt: true,
            sender: {
              select: {
                username: true
              }
            },
            receiver: {
              select: {
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.friendRequest.count()
        break

      case 'Notification':
        data = await db.notification.findMany({
          select: {
            id: true,
            type: true,
            read: true,
            createdAt: true,
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        count = await db.notification.count()
        break
    }

    return NextResponse.json({
      table,
      totalCount: count,
      data,
      limit,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[DB-VIEWER] Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 