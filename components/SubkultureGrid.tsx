import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users, MessageSquare } from 'lucide-react'

interface Subkulture {
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

interface SubkultureGridProps {
  subkultures: Subkulture[]
}

export default function SubkultureGrid({ subkultures }: SubkultureGridProps) {
  if (subkultures.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Child Subkultures</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subkultures.map((subkulture) => (
          <Card key={subkulture.id} className="overflow-hidden">
            <Link href={`/k/${subkulture.slug}`}>
              <div className="p-4 hover:bg-muted/50">
                <h3 className="font-semibold">k/{subkulture.name}</h3>
                {subkulture.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {subkulture.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {subkulture._count.members} members
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {subkulture._count.takes} takes
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