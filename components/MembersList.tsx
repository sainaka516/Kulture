import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Users, BadgeCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Member {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  joinedAt: string
}

interface MembersListProps {
  communityName: string
  memberCount: number
  slug: string
}

export default function MembersList({ communityName, memberCount, slug }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const fetchMembers = async () => {
    if (members.length > 0) return // Don't fetch if we already have members

    setIsLoading(true)
    setError(null)
    try {
      console.log('Fetching members for:', slug)
      const response = await fetch(`/api/k/${slug}/members`)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Received members data:', data)
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received')
      }
      
      setMembers(data)
    } catch (error) {
      console.error('Failed to fetch members:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch members')
    } finally {
      setIsLoading(false)
    }
  }

  const formatRole = (role: string) => {
    if (role === 'OWNER') return 'Creator'
    return role.toLowerCase()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) fetchMembers()
    }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 hover:text-foreground transition-colors">
          <Users className="h-4 w-4" />
          <span>{memberCount} members</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{communityName} Members</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : members.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No members found
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback>
                        {member.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/user/${member.id}`}
                          className="font-medium hover:underline"
                        >
                          {member.name || 'Anonymous User'}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="capitalize">{formatRole(member.role)}</span>
                        {' · '}
                        <span>
                          Joined {formatDistanceToNow(new Date(member.joinedAt))} ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 