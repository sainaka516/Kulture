'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  type: string
  message: string
  createdAt: string
  read: boolean
  data: any
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

  return (
    <div className="grid gap-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 ${notification.read ? 'bg-background' : 'bg-accent'}`}
        >
          <div className="flex flex-col gap-2">
            <p>{notification.message}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
            {notification.data?.link && (
              <Link
                href={notification.data.link}
                className="text-sm text-primary hover:underline"
              >
                View
              </Link>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
} 