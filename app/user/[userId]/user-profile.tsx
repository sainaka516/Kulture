'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, Trophy } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import TakeFeed from '@/components/TakeFeed'
import FriendRequestButton from '@/components/FriendRequestButton'
import UsernameEditor from '@/components/UsernameEditor'
import { Session } from 'next-auth'

interface UserProfileProps {
  user: any // Replace with proper type
  session: Session | null
  showEmail: boolean
}

export default function UserProfile({ user, session, showEmail }: UserProfileProps) {
  const [currentUser, setCurrentUser] = useState(user)
  const [rank, setRank] = useState<number | null>(null)
  
  useEffect(() => {
    // Fetch user's rank
    const fetchRank = async () => {
      try {
        const response = await fetch(`/api/users/${currentUser.id}/rank`)
        const data = await response.json()
        setRank(data.rank)
      } catch (error) {
        console.error('Error fetching user rank:', error)
      }
    }
    
    fetchRank()
  }, [currentUser.id])

  if (!currentUser) return null

  const isOwnProfile = session?.user?.id === currentUser.id

  return (
    <div className="container max-w-2xl py-6">
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUser.image ?? undefined} />
          <AvatarFallback>
            {currentUser.username?.[0]?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {isOwnProfile ? (
                  <UsernameEditor
                    currentUsername={currentUser.username}
                    onUsernameUpdated={(newUsername) => {
                      setCurrentUser(prev => ({ ...prev, username: newUsername }))
                    }}
                  />
                ) : (
                  <span>@{currentUser.username}</span>
                )}
                {rank && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <Trophy className="h-4 w-4" />
                    #{rank}
                  </span>
                )}
              </h1>
              {currentUser.verified && (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Verified
                </span>
              )}
            </div>
            {!isOwnProfile && (
              <FriendRequestButton 
                userId={currentUser.id} 
                initialStatus={
                  currentUser.friends?.some((f: any) => f.friendId === session?.user?.id)
                    ? 'FRIENDS'
                    : currentUser.receivedFriendRequests?.some((r: any) => r.senderId === session?.user?.id && r.status === 'PENDING')
                      ? 'PENDING'
                      : 'NONE'
                }
              />
            )}
          </div>
          {showEmail && currentUser.email && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{currentUser.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(currentUser.createdAt)}</span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <span className="font-semibold">{currentUser._count.takes}</span>{' '}
              <span className="text-muted-foreground">takes</span>
            </div>
            <div>
              <span className="font-semibold">{currentUser._count.comments}</span>{' '}
              <span className="text-muted-foreground">comments</span>
            </div>
            <div>
              <span className="font-semibold">{currentUser._count.communities}</span>{' '}
              <span className="text-muted-foreground">kultures</span>
            </div>
            <div>
              <span className="font-semibold">{currentUser._count.friends}</span>{' '}
              <span className="text-muted-foreground">friends</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Takes</h2>
        <TakeFeed 
          takes={currentUser.takes}
          communitySlug={null}
          defaultView="list"
          showViewSwitcher={true}
        />
      </div>
    </div>
  )
} 