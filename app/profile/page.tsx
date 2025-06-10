'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Mail, Calendar, MessageSquare, Share2, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'

interface UserStats {
  totalTakes: number
  totalComments: number
  totalCommunities: number
  createdAt: string
  joinedCommunities: Array<{
    id: string
    name: string
    slug: string
  }>
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [takes, setTakes] = useState<Take[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }

    if (status === 'authenticated' && session?.user) {
      // Fetch user takes
      fetch(`/api/users/${session.user.id}/takes`)
        .then((response) => response.json())
        .then((data) => {
          // Transform takes to include currentUserId and userVote
          const transformedTakes = data.map((take: Take) => ({
            ...take,
            currentUserId: session.user.id,
            userVote: take.votes?.find(vote => vote.userId === session.user.id)?.type || null,
            _count: {
              ...take._count,
              upvotes: take.votes?.filter(vote => vote.type === 'UP').length || 0,
              downvotes: take.votes?.filter(vote => vote.type === 'DOWN').length || 0
            }
          }))
          setTakes(transformedTakes)
        })
        .catch((error) => console.error('Error fetching takes:', error))

      // Fetch user stats
      fetch(`/api/users/${session.user.id}/stats`)
        .then((response) => response.json())
        .then((data) => setUserStats(data))
        .catch((error) => console.error('Error fetching user stats:', error))
        .finally(() => setIsLoading(false))
    }
  }, [status, session, router])

  if (isLoading || !session?.user) {
    return (
      <div className="container max-w-4xl py-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback>{session.user.name?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{session.user.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{session.user.email}</span>
            </div>
            {userStats?.createdAt && (
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {format(new Date(userStats.createdAt), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <Share2 className="h-5 w-5 mb-2" />
            <span className="text-xl font-bold">{userStats?.totalTakes ?? 0}</span>
            <span className="text-sm text-muted-foreground">Takes</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <MessageSquare className="h-5 w-5 mb-2" />
            <span className="text-xl font-bold">{userStats?.totalComments ?? 0}</span>
            <span className="text-sm text-muted-foreground">Comments</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <Users className="h-5 w-5 mb-2" />
            <span className="text-xl font-bold">{userStats?.totalCommunities ?? 0}</span>
            <span className="text-sm text-muted-foreground">Communities</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="takes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="takes">Takes</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="takes" className="space-y-4">
          <TakeFeed 
            takes={takes} 
            communitySlug={null}
            defaultView="list"
            showViewSwitcher={true}
          />
          {takes.length === 0 && (
            <p className="text-muted-foreground">You haven't shared any takes yet.</p>
          )}
        </TabsContent>

        <TabsContent value="communities" className="space-y-4">
          {userStats?.joinedCommunities && userStats.joinedCommunities.length > 0 ? (
            <div className="grid gap-4">
              {userStats.joinedCommunities.map((community) => (
                <Card key={community.id} className="p-4">
                  <h3 className="font-semibold">{community.name}</h3>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You haven't joined any communities yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 