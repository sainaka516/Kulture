'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import TakeCard from '@/components/TakeCard'
import { TakesProvider, useTakes } from '@/lib/contexts/TakesContext'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, Trophy, MessageSquare, Share2, Users2, Heart, Layers, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import FriendRequestButton from '@/components/FriendRequestButton'
import UsernameEditor from '@/components/UsernameEditor'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import KultureGrid from '@/components/KultureGrid'

interface UserProfileProps {
  currentUser: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified: boolean
    takes: Take[]
    joinedKultures: Array<{
      id: string
      name: string
      slug: string
      description: string | null
      _count: {
        members: number
        takes: number
        children: number
      }
    }>
    ownedKultures: Array<{
      id: string
      name: string
      slug: string
      description: string | null
      _count: {
        members: number
        takes: number
        children: number
      }
    }>
    recentVotes: Array<{
      id: string
      type: string
      createdAt: string
      take: {
        id: string
        title: string
        community: {
          name: string
          slug: string
        }
      }
    }>
    recentComments: Array<{
      id: string
      content: string
      createdAt: string
      take: {
        id: string
        title: string
        community: {
          name: string
          slug: string
        }
      }
    }>
    friends: Array<{
      id: string
      name: string | null
      username: string
      image: string | null
    }>
    _count: {
      takes: number
      comments: number
      upvotes: number
      downvotes: number
      friends: number
      ownedKultures: number
    }
    createdAt: string
  }
  session: any | null
  showEmail: boolean
}

function UserProfileContent({ currentUser, session, showEmail }: UserProfileProps) {
  const { toast } = useToast()
  const { updateTake, setTakes } = useTakes()
  const [isLoading, setIsLoading] = useState(false)

  // Check if this is the current user's profile
  const isOwnProfile = session?.user?.id === currentUser.id

  // Handle take deletion
  const handleDeleteTake = (takeId: string) => {
    // Remove the take from the context
    setTakes(prevTakes => prevTakes.filter(take => take.id !== takeId))
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={currentUser.image || undefined} />
            <AvatarFallback>{currentUser.name?.[0] || currentUser.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{currentUser.name || currentUser.username}</h1>
              {currentUser.verified && (
                <div className="flex items-center gap-1 text-blue-500">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">@{currentUser.username}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDate(currentUser.createdAt)}</span>
            </div>
          </div>
          {!isOwnProfile && (
            <div className="flex-shrink-0">
              <FriendRequestButton userId={currentUser.id} />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentUser._count.takes}</div>
              <div className="text-sm text-muted-foreground">Takes</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentUser._count.comments}</div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentUser._count.friends}</div>
              <div className="text-sm text-muted-foreground">Friends</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentUser._count.ownedKultures}</div>
              <div className="text-sm text-muted-foreground">Created Kultures</div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div>
            <Tabs defaultValue="takes">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="takes">Takes</TabsTrigger>
                <TabsTrigger value="kultures">Kultures</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="takes" className="mt-6">
                <TakesProvider initialTakes={currentUser.takes}>
                  <TakeFeed
                    takes={currentUser.takes}
                    currentKultureSlug={null}
                    defaultView="swipe"
                    showViewSwitcher={true}
                    showDeleteButton={isOwnProfile}
                    onDelete={handleDeleteTake}
                    onVote={async (takeId: string, voteType: 'UP' | 'DOWN') => {
                      console.log('onVote called with:', takeId, voteType)
                      try {
                        const response = await fetch(`/api/takes/${takeId}/vote`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: voteType }),
                        })

                        if (!response.ok) {
                          throw new Error('Failed to vote')
                        }

                        const updatedTake = await response.json()
                        console.log('API response:', updatedTake)
                        
                        // Update the take in the context
                        updateTake(updatedTake)
                      } catch (error) {
                        console.error('Error voting:', error)
                        toast({
                          title: 'Error',
                          description: 'Failed to vote. Please try again.',
                          variant: 'destructive',
                        })
                      }
                    }}
                  />
                </TakesProvider>
              </TabsContent>
              
              <TabsContent value="kultures" className="mt-6">
                <div className="space-y-6">
                  {currentUser.ownedKultures.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Created Kultures</h3>
                      <KultureGrid kultures={currentUser.ownedKultures} />
                    </div>
                  )}
                  {currentUser.joinedKultures.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Joined Kultures</h3>
                      <KultureGrid kultures={currentUser.joinedKultures} />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-6">
                <div className="space-y-6">
                  {currentUser.recentVotes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Votes</h3>
                      <div className="space-y-2">
                        {currentUser.recentVotes.slice(0, 5).map((vote) => (
                          <Card key={vote.id} className="p-3">
                            <div className="flex items-center gap-2">
                              <Heart className={`h-4 w-4 ${vote.type === 'UP' ? 'text-green-500' : 'text-red-500'}`} />
                              <span className="text-sm">
                                {vote.type === 'UP' ? 'Upvoted' : 'Downvoted'} "{vote.take.title}"
                              </span>
                              <span className="text-xs text-muted-foreground">
                                in {vote.take.community.name}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {currentUser.recentComments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
                      <div className="space-y-2">
                        {currentUser.recentComments.slice(0, 5).map((comment) => (
                          <Card key={comment.id} className="p-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                Commented on "{comment.take.title}"
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {comment.content}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                in {comment.take.community.name}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="friends" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Friends ({currentUser._count.friends})</h3>
                  {currentUser.friends.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {currentUser.friends.map((friend) => (
                        <Card key={friend.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={friend.image || undefined} />
                              <AvatarFallback>{friend.name?.[0] || friend.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{friend.name || friend.username}</div>
                              <div className="text-sm text-muted-foreground">@{friend.username}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No friends yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Upvotes</span>
                  <span className="font-medium">{currentUser._count.upvotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Downvotes</span>
                  <span className="font-medium">{currentUser._count.downvotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Joined Kultures</span>
                  <span className="font-medium">{currentUser.joinedKultures.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created Kultures</span>
                  <span className="font-medium">{currentUser._count.ownedKultures}</span>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {currentUser.recentVotes.slice(0, 3).map((vote) => (
                  <div key={vote.id} className="flex items-center gap-2 text-sm">
                    <Heart className={`h-3 w-3 ${vote.type === 'UP' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="truncate">
                      {vote.type === 'UP' ? 'Upvoted' : 'Downvoted'} "{vote.take.title}"
                    </span>
                  </div>
                ))}
                {currentUser.recentComments.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    <span className="truncate">Commented on "{comment.take.title}"</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UserProfile({ currentUser, session, showEmail }: UserProfileProps) {
  return (
    <TakesProvider initialTakes={currentUser.takes}>
      <UserProfileContent 
        currentUser={currentUser} 
        session={session} 
        showEmail={showEmail} 
      />
    </TakesProvider>
  )
} 