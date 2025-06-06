import Link from 'next/link'
import { Card } from '@/components/ui/card'

interface Kulture {
  id: string
  name: string
  slug: string
  description: string | null
  _count: {
    members: number
    takes: number
    children: number
  }
}

interface KultureGridProps {
  kultures: Kulture[]
}

export default function KultureGrid({ kultures }: KultureGridProps) {
  if (kultures.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Associated Kultures</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kultures.map((kulture) => (
          <Card key={kulture.id} className="overflow-hidden">
            <Link href={`/k/${kulture.slug}`}>
              <div className="p-4 hover:bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>{kulture.name}</span>
                  {kulture._count.children > 0 && (
                    <span className="text-xs text-muted-foreground">
                      > {kulture._count.children} associated
                    </span>
                  )}
                </h3>
                {kulture.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {kulture.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span>{kulture._count.members} members</span>
                  </div>
                  <div className="flex items-center">
                    <span>{kulture._count.takes} takes</span>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
} 