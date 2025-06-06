import Link from 'next/link'
import { Community } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KultureWithCounts extends Community {
  parent?: {
    name: string
    slug: string
  } | null
  _count: {
    members: number
    posts: number
    children: number
  }
}

interface KultureListProps {
  communities: KultureWithCounts[]
}

export default function KultureList({ communities }: KultureListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Popular Kultures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {communities.map((community) => (
            <div
              key={community.id}
              className="flex items-center justify-between"
            >
              <Link
                href={`/k/${community.slug}`}
                className="flex-1 hover:text-foreground text-muted-foreground"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{community.name}</span>
                  {community._count.children > 0 && (
                    <span className="text-xs text-muted-foreground">
                      > {community._count.children} associated
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 