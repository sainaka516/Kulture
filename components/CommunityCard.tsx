import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users, MessageSquare } from 'lucide-react'

interface CommunityCardProps {
  community: {
    id: string
    name: string
    slug: string
    description: string | null
    parent?: {
      name: string
      slug: string
    } | null
    _count: {
      members: number
      takes: number
      children: number
    }
  }
}

export default function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/k/${community.slug}`}
              className="text-lg font-semibold hover:text-purple-900 dark:hover:text-purple-400"
            >
              {community.parent ? (
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">{community.parent.name}</span>
                  <span className="text-muted-foreground mx-1">></span>
                  <span>{community.name}</span>
                </span>
              ) : (
                community.name
              )}
            </Link>
            {community.parent && (
              <div className="text-sm text-muted-foreground mt-1">
                Sub-community of{' '}
                <Link
                  href={`/k/${community.parent.slug}`}
                  className="hover:text-foreground"
                >
                  {community.parent.name}
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
            {community._count?.members ?? 0} members
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            {community._count?.takes ?? 0} takes
          </div>
          {(community._count?.children ?? 0) > 0 && (
            <div className="flex items-center">
              <span>{community._count?.children ?? 0} sub-communities</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
} 