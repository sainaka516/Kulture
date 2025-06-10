'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function FriendsClient() {
  const [friends, setFriends] = useState<any[]>([])
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
        description: 'Failed to load friends',
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

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't added any friends yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {friends.map((friend) => (
        <Link key={friend.id} href={`/user/${friend.id}`}>
          <Card className="p-4 hover:bg-accent">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={friend.image} />
                <AvatarFallback>{friend.name?.[0] || friend.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{friend.name || friend.username}</p>
                <p className="text-sm text-muted-foreground">@{friend.username}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
} 