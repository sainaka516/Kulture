'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

export default function FriendRequestBadge() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    const fetchRequestCount = async () => {
      if (!session?.user) return

      try {
        const response = await fetch('/api/friends/requests')
        if (response.ok) {
          const requests = await response.json()
          setRequestCount(requests.length)
        }
      } catch (error) {
        console.error('Failed to fetch friend requests:', error)
      }
    }

    fetchRequestCount()
    // Poll for new requests every minute
    const interval = setInterval(fetchRequestCount, 60000)
    return () => clearInterval(interval)
  }, [session])

  if (requestCount === 0) return null

  return (
    <div className="absolute -right-1 -top-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
      <span className="text-xs font-medium text-white">{requestCount}</span>
    </div>
  )
} 