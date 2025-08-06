'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FriendRequestButtonProps {
  userId: string
  initialStatus?: 'NONE' | 'PENDING' | 'FRIENDS'
}

export default function FriendRequestButton({ userId, initialStatus = 'NONE' }: FriendRequestButtonProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkFriendshipStatus = async () => {
      try {
        const response = await fetch(`/api/friends/status/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
        }
      } catch (error) {
        console.error('Error checking friendship status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    if (initialStatus === 'NONE') {
      checkFriendshipStatus()
    } else {
      setIsCheckingStatus(false)
    }
  }, [userId, initialStatus])

  const handleSendRequest = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      setStatus('PENDING')
      toast({
        title: 'Friend request sent!',
        description: 'They will be notified of your request.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send friend request',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <Button variant="secondary" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (status === 'FRIENDS') {
    return (
      <Button variant="secondary" disabled>
        <Check className="h-4 w-4 mr-2" />
        Friends
      </Button>
    )
  }

  if (status === 'PENDING') {
    return (
      <Button variant="secondary" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Request Pending
      </Button>
    )
  }

  return (
    <Button onClick={handleSendRequest} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      Add Friend
    </Button>
  )
} 