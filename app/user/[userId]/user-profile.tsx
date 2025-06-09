'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, Trophy, MessageSquare, Share2, Users2, Heart, Layers } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import TakeFeed from '@/components/TakeFeed'
import FriendRequestButton from '@/components/FriendRequestButton'
import UsernameEditor from '@/components/UsernameEditor'
import { Session } from 'next-auth'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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

  const stats = [
    {
      label: 'Takes',
      value: currentUser._count.takes,
      icon: Share2
    },
    {
      label: 'Comments',
      value: currentUser._count.comments,
      icon: MessageSquare
    },
    {
      label: 'Kultures',
      value: currentUser._count.communities,
      icon: Layers
    },
    {
      label: 'Friends',
      value: currentUser._count.friends,
      icon: Users2
    }
  ]

  return (
    <div className="container max-w-4xl py-8">
      {/* Hero Section */}
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-16">
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={currentUser.image ?? undefined} />
            <AvatarFallback className="text-2xl">
              {currentUser.username?.[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="mb-2">
            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <UsernameEditor
                  currentUsername={currentUser.username}
                  onUsernameUpdated={(newUsername) => {
                    setCurrentUser(prev => ({ ...prev, username: newUsername }))
                  }}
                />
              ) : (
                <h1 className="text-2xl font-bold text-white">@{currentUser.username}</h1>
              )}
              {rank && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
                  <Trophy className="h-4 w-4" />
                  #{rank}
                </span>
              )}
            </div>
          </div>
        </div>
        {!isOwnProfile && (
          <div className="absolute right-8 bottom-4">
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
          </div>
        )}
      </div>

      {/* User Info & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User Info Card */}
        <Card className="p-6 col-span-2">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <div className="space-y-3">
            {showEmail && currentUser.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{currentUser.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDate(currentUser.createdAt)}</span>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-2 rounded-lg bg-muted/50">
                <stat.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Takes Feed */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Takes</h2>
        <TakeFeed 
          takes={currentUser.takes}
          communitySlug={null}
          defaultView="list"
          showViewSwitcher={true}
        />
      </Card>
    </div>
  )
} 