'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Users, MessageSquare } from 'lucide-react'
import TakeCard from '@/components/TakeCard'

interface SearchResult {
  users: Array<{
    id: string
    name: string
    username: string
    image: string | null
  }>
  kultures: Array<{
    id: string
    name: string
    description: string | null
    slug: string
    _count: {
      members: number
      takes: number
    }
  }>
  takes: Array<{
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
    communityId: string
    authorId: string
    author: {
      id: string
      name: string
      username: string
      image: string | null
      verified: boolean
    }
    community: {
      id: string
      name: string
      slug: string
    }
    votes: Array<{
      id: string
      type: 'UP' | 'DOWN'
      userId: string
      takeId: string
      createdAt: string
      updatedAt: string
    }>
    _count: {
      comments: number
      upvotes: number
      downvotes: number
    }
    currentUserId?: string
    userVote?: 'UP' | 'DOWN' | null
  }>
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults(null)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Failed to fetch search results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, activeTab])

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Enter a search term to find users, kultures, and takes.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search Results for "{query}"</h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="kultures">Kultures</TabsTrigger>
          <TabsTrigger value="takes">Takes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {/* Users Section */}
          {results?.users.length ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {results.users.map((user) => (
                  <Link key={user.id} href={`/user/${user.id}`}>
                    <Card className="p-4 hover:bg-muted/50 transition">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} className="h-10 w-10" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Kultures Section */}
          {results?.kultures.length ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Kultures</h2>
              <div className="grid gap-4">
                {results.kultures.map((kulture) => (
                  <Link key={kulture.id} href={`/k/${kulture.slug}`}>
                    <Card className="p-4 hover:bg-muted/50 transition">
                      <h3 className="font-medium">{kulture.name}</h3>
                      {kulture.description && (
                        <p className="text-sm text-muted-foreground mt-1">{kulture.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {kulture._count.members} members
                        </span>
                        <span>{kulture._count.takes} takes</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Takes Section */}
          {results?.takes.length ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Takes</h2>
              <div className="grid gap-4">
                {results.takes.map((take) => (
                  <TakeCard key={take.id} take={take} currentKultureSlug={null} />
                ))}
              </div>
            </div>
          ) : null}

          {!results?.users.length && !results?.kultures.length && !results?.takes.length && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{query}"</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          {results?.users.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {results.users.map((user) => (
                <Link key={user.id} href={`/user/${user.id}`}>
                  <Card className="p-4 hover:bg-muted/50 transition">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} className="h-10 w-10" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found for "{query}"</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kultures">
          {results?.kultures.length ? (
            <div className="grid gap-4">
              {results.kultures.map((kulture) => (
                <Link key={kulture.id} href={`/k/${kulture.slug}`}>
                  <Card className="p-4 hover:bg-muted/50 transition">
                    <h3 className="font-medium">{kulture.name}</h3>
                    {kulture.description && (
                      <p className="text-sm text-muted-foreground mt-1">{kulture.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {kulture._count.members} members
                      </span>
                      <span>{kulture._count.takes} takes</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No kultures found for "{query}"</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="takes">
          {results?.takes.length ? (
            <div className="grid gap-4">
              {results.takes.map((take) => (
                <TakeCard key={take.id} take={take} currentKultureSlug={null} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No takes found for "{query}"</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 