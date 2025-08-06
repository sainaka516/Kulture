'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  type: string
  createdAt: string
  read: boolean
  takeId?: string
  fromId?: string
  take?: {
    id: string
    title: string
  }
  from?: {
    id: string
    username: string
    image: string | null
  }
}

export default function NotificationsClient() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read)
    if (unreadNotifications.length === 0) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadNotifications.map(n => n.id),
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        )
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No notifications yet.</p>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'TAKE_UPVOTED':
        return `${notification.from?.username || 'Someone'} upvoted your take "${notification.take?.title || 'Untitled'}"`
      case 'TAKE_DOWNVOTED':
        return `${notification.from?.username || 'Someone'} downvoted your take "${notification.take?.title || 'Untitled'}"`
      case 'FRIEND_REQUEST_ACCEPTED':
        return `${notification.from?.username || 'Someone'} accepted your friend request`
      case 'COMMENT_ADDED':
        return `${notification.from?.username || 'Someone'} commented on your take "${notification.take?.title || 'Untitled'}"`
      default:
        return `You have a new notification`
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.takeId) {
      return `/take/${notification.takeId}`
    }
    if (notification.fromId) {
      return `/user/${notification.fromId}`
    }
    return null
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        </div>
      )}
      <div className="grid gap-4">
        {notifications.map((notification) => {
        const link = getNotificationLink(notification)
        return (
          <Card
            key={notification.id}
            className={`p-4 cursor-pointer transition-colors ${
              notification.read ? 'bg-background hover:bg-accent/50' : 'bg-accent hover:bg-accent/80'
            }`}
            onClick={() => {
              if (!notification.read) {
                markAsRead(notification.id)
              }
              if (link) {
                window.location.href = link
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <p className={notification.read ? 'text-muted-foreground' : 'font-medium'}>
                {getNotificationMessage(notification)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
              {link && (
                <span className="text-sm text-primary hover:underline">
                  Click to view
                </span>
              )}
            </div>
          </Card>
        )
      })}
      </div>
    </div>
  )
} 