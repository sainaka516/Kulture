'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Loader2, Trophy, Medal, ThumbsDown, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTimeAgo } from '@/lib/date'

interface LeaderboardUser {
  id: string
  name: string | null
  image: string | null
  points: number
  verifiedTakes: number
  multiVerifiedTakes: number
}

interface WorstTake {
  id: string
  title: string
  content: string | null
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string
    image: string | null
  }
  community: {
    id: string
    name: string
    slug: string
    parent: {
      id: string
      name: string
      slug: string
    } | null
  }
  upvotes: number
  downvotes: number
  score: number
  _count: {
    comments: number
  }
}

export default function LeaderboardClient() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [worstTakes, setWorstTakes] = useState<WorstTake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'best' | 'worst'>('best')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (view === 'best') {
          const response = await fetch('/api/leaderboard')
          const data = await response.json()
          setUsers(data)
        } else {
          const response = await fetch('/api/leaderboard/worst')
          const data = await response.json()
          setWorstTakes(data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [view])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <Button
          variant={view === 'best' ? 'default' : 'outline'}
          onClick={() => setView('best')}
          className="min-w-[120px]"
        >
          Kulture Kings
        </Button>
        <Button
          variant={view === 'worst' ? 'default' : 'outline'}
          onClick={() => setView('worst')}
          className="min-w-[120px]"
        >
          Worst Takes
        </Button>
      </div>

      {view === 'best' ? (
        // Best Takes View
        <div className="space-y-4">
          {users.map((user, index) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  {index === 0 ? (
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  ) : index === 1 ? (
                    <Medal className="h-6 w-6 text-gray-400" />
                  ) : index === 2 ? (
                    <Medal className="h-6 w-6 text-amber-600" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <UserAvatar
                  name={user.name}
                  image={user.image}
                  className="h-10 w-10"
                />
                <div className="flex-1">
                  <Link
                    href={`/user/${user.id}`}
                    className="font-semibold hover:underline"
                  >
                    {user.name}
                    {index === 0 && (
                      <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                        Kulture King 👑
                      </Badge>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{user.verifiedTakes} Kulture Verified takes</span>
                    {user.multiVerifiedTakes > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {user.multiVerifiedTakes} multi-verified
                          <Badge variant="secondary" className="h-4 px-1 text-xs">
                            2x
                          </Badge>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-lg font-bold">
                  {user.points} points
                </div>
              </div>
            </Card>
          ))}

          {users.length === 0 && (
            <Card className="p-8 text-center">
              <h2 className="text-lg font-semibold">No Verified Takes Yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Get your takes verified by the community to appear on the leaderboard!
              </p>
            </Card>
          )}
        </div>
      ) : (
        // Worst Takes View
        <div className="space-y-4">
          {worstTakes.map((take, index) => (
            <Card key={take.id} className="p-4">
              <div className="space-y-4">
                {/* Take Header */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
                    <span className="text-lg font-bold text-red-500">
                      #{index + 1}
                    </span>
                  </div>
                  <UserAvatar
                    name={take.author.name}
                    image={take.author.image}
                    className="h-10 w-10"
                  />
                  <div className="flex-1">
                    <Link
                      href={`/u/${take.author.username}`}
                      className="font-semibold hover:underline"
                    >
                      {take.author.name || take.author.username}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link
                        href={`/k/${take.community.slug}`}
                        className="hover:underline"
                      >
                        {take.community.parent ? (
                          <>
                            <span>{take.community.parent.name}</span>
                            <span className="mx-1">&gt;</span>
                            <span>{take.community.name}</span>
                          </>
                        ) : (
                          take.community.name
                        )}
                      </Link>
                      <span>•</span>
                      <span>{formatTimeAgo(new Date(take.createdAt))}</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-500">
                    {take.downvotes} dislikes
                  </div>
                </div>

                {/* Take Content */}
                <div>
                  <Link href={`/take/${take.id}`} className="block group">
                    <h3 className="text-lg font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {take.title}
                    </h3>
                    {take.content && (
                      <p className="text-muted-foreground mt-1 line-clamp-2">
                        {take.content}
                      </p>
                    )}
                  </Link>
                </div>

                {/* Take Footer */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{take._count.comments} comments</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {worstTakes.length === 0 && (
            <Card className="p-8 text-center">
              <h2 className="text-lg font-semibold">No Controversial Takes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Looks like all takes are doing well! Check back later.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 