'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Friend {
  id: string
  name: string | null
  image: string | null
  username: string | null
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends')
      if (!response.ok) throw new Error('Failed to fetch friends')
      const data = await response.json()
      setFriends(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load friends list',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Friends</h1>
        <Link
          href="/friends/requests"
          className="text-sm text-muted-foreground hover:underline"
        >
          View Friend Requests
        </Link>
      </div>
      {friends.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          You haven't added any friends yet
        </Card>
      ) : (
        <div className="space-y-4">
          {friends.map((friend) => (
            <Card key={friend.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={friend.image ?? undefined} />
                  <AvatarFallback>
                    {friend.name?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/user/${friend.id}`}
                    className="font-semibold hover:underline"
                  >
                    {friend.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    @{friend.username}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 