import Link from 'next/link'
import { Community } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SubkultureWithCounts extends Community {
  _count: {
    members: number
    posts: number
    children: number
  }
}

interface SubkultureListProps {
  communities: SubkultureWithCounts[]
}

export default function SubkultureList({ communities }: SubkultureListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Popular Subkultures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {communities.map((community) => (
            <div
              key={community.id}
              className="flex items-center justify-between group"
            >
              <Link
                href={`/k/${community.slug}`}
                className="flex-1 hover:text-foreground text-muted-foreground"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">k/{community.name}</span>
                  {community._count.children > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({community._count.children} sub-communities)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {community.description}
                </p>
              </Link>
              <div className="text-xs text-muted-foreground">
                {community._count.members.toLocaleString()} members
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 