import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare } from 'lucide-react'
import { Community } from "@prisma/client"
import { Button } from "@/components/ui/button"

export interface CommunityCardProps {
  community: {
    id: string
    name: string
    slug: string
    description?: string | null
    parent?: {
      name: string
      slug: string
      parent?: {
        name: string
        slug: string
      } | null
    } | null
    _count: {
      members: number
      takes: number
      children: number
    }
  }
}

export function CommunityCard({ community }: CommunityCardProps) {
  // Helper function to build the hierarchy display
  const getHierarchyDisplay = () => {
    if (!community.parent) {
      return community.name
    }

    if (community.parent.parent) {
      // It's a child of a child
      return (
        <span className="flex items-center gap-1">
          <Link href={`/k/${community.parent.parent.slug}`} className="text-muted-foreground hover:text-foreground">
            {community.parent.parent.name}
          </Link>
          <span className="text-muted-foreground mx-1">›</span>
          <Link href={`/k/${community.parent.slug}`} className="text-muted-foreground hover:text-foreground">
            {community.parent.name}
          </Link>
          <span className="text-muted-foreground mx-1">›</span>
          <span>{community.name}</span>
        </span>
      )
    }

    // It's a direct child
    return (
      <span className="flex items-center gap-1">
        <Link href={`/k/${community.parent.slug}`} className="text-muted-foreground hover:text-foreground">
          {community.parent.name}
        </Link>
        <span className="text-muted-foreground mx-1">›</span>
        <span>{community.name}</span>
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={`/k/${community.slug}`}>{community.name}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {community.description && <p className="text-sm text-muted-foreground">{community.description}</p>}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold">{community._count.takes}</span> takes
          </div>
          <div className="text-sm">
            <span className="font-semibold">{community._count.children}</span> subkultures
          </div>
          <div className="text-sm">
            <span className="font-semibold">{community._count.members}</span> members
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommunityCard; 