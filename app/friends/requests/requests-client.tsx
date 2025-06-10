'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FriendRequest {
  id: string
  sender: {
    id: string
    name: string | null
    image: string | null
    username: string
  }
}

export default function RequestsClient() {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests')
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load friend requests',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      setProcessingIds(prev => new Set(prev).add(requestId))
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to process request')

      setRequests(prev => prev.filter(r => r.id !== requestId))
      toast({
        title: status === 'ACCEPTED' ? 'Friend request accepted!' : 'Friend request rejected',
        description: status === 'ACCEPTED' ? 'You are now friends!' : 'The friend request has been rejected.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process friend request',
        variant: 'destructive'
      })
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
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

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pending friend requests.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={request.sender.image || undefined} />
              <AvatarFallback>
                {request.sender.name?.[0] || request.sender.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{request.sender.name || request.sender.username}</p>
              <p className="text-sm text-muted-foreground">@{request.sender.username}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleRequest(request.id, 'ACCEPTED')}
                disabled={processingIds.has(request.id)}
              >
                {processingIds.has(request.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Accept'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRequest(request.id, 'REJECTED')}
                disabled={processingIds.has(request.id)}
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 