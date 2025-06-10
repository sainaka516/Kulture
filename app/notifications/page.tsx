export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ThumbsUp, ThumbsDown, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  takeId: string | null
  fromId: string | null
  read: boolean
  createdAt: string
  take: {
    id: string
    title: string
  } | null
  from: {
    id: string
    username: string
    image: string | null
  } | null
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchNotifications()
    }
  }, [session])

  useEffect(() => {
    // Mark all unread notifications as read
    const markAsRead = async () => {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: unreadIds }),
        })
      } catch (error) {
        console.error('Error marking notifications as read:', error)
      }
    }

    markAsRead()
  }, [notifications])

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <Card className="p-6 text-center text-muted-foreground">
          No notifications yet
        </Card>
      </div>
    )
  }

  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'FRIEND_REQUEST_ACCEPTED':
        return {
          icon: <UserCheck className="h-5 w-5 text-green-500" />,
          content: (
            <>
              <Link href={`/user/${notification.from?.id}`} className="font-semibold hover:underline">
                @{notification.from?.username}
              </Link>{' '}
              accepted your friend request
            </>
          ),
        }
      case 'TAKE_UPVOTED':
        return {
          icon: <ThumbsUp className="h-5 w-5 text-blue-500" />,
          content: (
            <>
              <Link href={`/user/${notification.from?.id}`} className="font-semibold hover:underline">
                @{notification.from?.username}
              </Link>{' '}
              agreed with your take{' '}
              <Link href={`/take/${notification.take?.id}`} className="font-semibold hover:underline">
                {notification.take?.title}
              </Link>
            </>
          ),
        }
      case 'TAKE_DOWNVOTED':
        return {
          icon: <ThumbsDown className="h-5 w-5 text-red-500" />,
          content: (
            <>
              <Link href={`/user/${notification.from?.id}`} className="font-semibold hover:underline">
                @{notification.from?.username}
              </Link>{' '}
              disagreed with your take{' '}
              <Link href={`/take/${notification.take?.id}`} className="font-semibold hover:underline">
                {notification.take?.title}
              </Link>
            </>
          ),
        }
      default:
        return null
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="space-y-4">
        {notifications.map((notification) => {
          const content = getNotificationContent(notification)
          if (!content) return null

          return (
            <Card
              key={notification.id}
              className={cn(
                'p-4 flex items-start gap-4',
                !notification.read && 'bg-purple-50 dark:bg-purple-900/10'
              )}
            >
              {notification.from && (
                <UserAvatar
                  user={{
                    image: notification.from.image,
                    username: notification.from.username,
                    name: notification.from.username
                  }}
                  className="h-10 w-10"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {content.icon}
                  <p className="text-sm">{content.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt))} ago
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 