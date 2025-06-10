'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Community, CommunityMember, Take } from '@prisma/client'
import KultureList from '@/components/KultureList'

interface KultureWithCounts extends Community {
  owner: {
    id: string
    name: string | null
    image: string | null
  }
  parent?: {
    name: string
    slug: string
  } | null
  members: CommunityMember[]
  takes: Take[]
  children: Community[]
  _count: {
    members: number
    takes: number
    children: number
  }
}

interface AssociatedKulturesClientProps {
  communities: KultureWithCounts[]
}

export default function AssociatedKulturesClient({ communities }: AssociatedKulturesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter communities based on search query
  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Associated Kultures</h1>
          <p className="text-muted-foreground mt-2">
            Browse and join associated kultures
          </p>
        </div>
        <Link href="/create-kulture">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Associated Kulture
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search associated kultures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredCommunities.length > 0 ? (
        <KultureList communities={filteredCommunities} />
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            No associated kultures found matching your search.
          </p>
        </div>
      )}
    </div>
  )
} 