export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface FriendRequest {
  id: string
  sender: {
    id: string
    name: string | null
    image: string | null
    username: string | null
  }
}

export default function FriendRequestsPage() {
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
      <div className="container max-w-2xl py-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>
      {requests.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No pending friend requests
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={request.sender.image ?? undefined} />
                    <AvatarFallback>
                      {request.sender.name?.[0] ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/user/${request.sender.id}`}
                      className="font-semibold hover:underline"
                    >
                      {request.sender.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      @{request.sender.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleRequest(request.id, 'ACCEPTED')}
                    disabled={processingIds.has(request.id)}
                    size="sm"
                    variant="accept"
                  >
                    {processingIds.has(request.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRequest(request.id, 'REJECTED')}
                    disabled={processingIds.has(request.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 