import Link from 'next/link'
import { Community, CommunityMember, Take } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, MessageSquare, FolderTree } from 'lucide-react'

interface KultureWithCounts extends Community {
  owner: {
    id: string
    name: string | null
    image: string | null
  }
  image: string | null
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

interface KultureListProps {
  communities: KultureWithCounts[]
}

export default function KultureList({ communities }: KultureListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {communities.map((community) => (
        <Link
          key={community.id}
          href={`/k/${community.slug}`}
          className="block"
        >
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    {community.image ? (
                      <AvatarImage src={community.image} alt={community.name} />
                    ) : (
                      <AvatarFallback>
                        {community.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{community.name}</CardTitle>
                    {community.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {community.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {community._count.members} members
                </div>
                <div className="flex items-center">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {community._count.takes} takes
                </div>
                {community._count.children > 0 && (
                  <div className="flex items-center">
                    <FolderTree className="mr-1 h-4 w-4" />
                    {community._count.children} associated kultures
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
} 