'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import KultureGrid from '@/components/KultureGrid'

interface AssociatedKulturesClientProps {
  community: {
    name: string
    slug: string
    children: Array<{
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
  }
}

export default function AssociatedKulturesClient({ community }: AssociatedKulturesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter kultures based on search query
  const filteredKultures = community.children.filter((kulture) =>
    kulture.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kulture.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/k/${community.slug}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to {community.name}
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Associated Kultures</h1>
          <p className="text-muted-foreground mt-2">
            Browse all kultures associated with {community.name}
          </p>
        </div>
        <Link href={`/create-kulture?parent=${community.slug}`}>
          <Button>Create Associated Kulture</Button>
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

      {filteredKultures.length > 0 ? (
        <KultureGrid kultures={filteredKultures} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? 'No associated kultures found matching your search.'
              : 'No associated kultures found.'}
          </p>
        </div>
      )}
    </div>
  )
} 