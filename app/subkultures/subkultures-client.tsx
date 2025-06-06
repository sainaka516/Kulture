'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, MessageSquare, PlusCircle, Search } from 'lucide-react'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  parent: {
    name: string
    slug: string
  } | null
  children: {
    name: string
    slug: string
  }[]
  _count: {
    members: number
    posts: number
    children: number
  }
}

interface SubkulturesClientProps {
  communities: Community[]
}

export default function SubkulturesClient({ communities }: SubkulturesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCommunities = communities.filter((community) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      community.name.toLowerCase().includes(searchLower) ||
      community.description?.toLowerCase().includes(searchLower) ||
      community.children.some((child) =>
        child.name.toLowerCase().includes(searchLower)
      )
    )
  })

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subkultures</h1>
          <p className="text-muted-foreground mt-1">
            Browse and join communities on Kulture
          </p>
        </div>
        <Link href="/create-subkulture">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Subkulture
          </Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subkultures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommunities.map((community) => (
          <Card key={community.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/k/${community.slug}`}
                    className="text-lg font-semibold hover:text-purple-900 dark:hover:text-purple-400"
                  >
                    k/{community.name}
                  </Link>
                  {community.parent && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Sub-community of{' '}
                      <Link
                        href={`/k/${community.parent.slug}`}
                        className="hover:text-foreground"
                      >
                        k/{community.parent.name}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {community.description || 'No description available.'}
              </p>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {community._count.members} members
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{community._count.members} members</span>
                  <span>•</span>
                  <span>{community._count.posts} takes</span>
                </div>
                {community._count.children > 0 && (
                  <div>
                    {community._count.children} sub-communities
                  </div>
                )}
              </div>

              {community.children.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Sub-communities:</p>
                  <div className="flex flex-wrap gap-2">
                    {community.children.map((child) => (
                      <Link
                        key={child.slug}
                        href={`/k/${child.slug}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        k/{child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        {filteredCommunities.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">
              No subkultures found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 