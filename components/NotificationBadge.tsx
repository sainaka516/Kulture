'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function NotificationBadge() {
  const { data: session } = useSession()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user) return

      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const notifications = await response.json()
          const unreadCount = notifications.filter((n: any) => !n.read).length
          setCount(unreadCount)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [session])

  if (count === 0) return null

  return (
    <div className="absolute -right-1 -top-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
      <span className="text-xs font-medium text-white">{count}</span>
    </div>
  )
} 