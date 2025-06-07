import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Users, MessageSquare } from 'lucide-react'

interface KultureGridProps {
  kultures: Array<{
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

export default function KultureGrid({ kultures }: KultureGridProps) {
  if (!kultures || kultures.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4">
      {kultures.map((kulture) => (
        <Link
          key={kulture.id}
          href={`/k/${kulture.slug}`}
          className="block"
        >
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{kulture.name}</h3>
                {kulture._count.children > 0 && (
                  <Badge variant="secondary">
                    {kulture._count.children} associated kultures
                  </Badge>
                )}
              </div>
              {kulture.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {kulture.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{kulture._count.members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{kulture._count.takes}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
} 