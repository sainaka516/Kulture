'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import VoteButtons from '@/components/VoteButtons'

interface Take {
  id: string
  title: string
  content: string | null
  createdAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
  }
  community: {
    id: string
    name: string
    slug: string
  }
  votes: {
    type: 'UP' | 'DOWN'
    userId: string
  }[]
  _count?: {
    comments: number
  }
}

interface TakeCardProps {
  take: Take
}

export default function TakeCard({ take }: TakeCardProps) {
  // Calculate vote score with null check
  const voteScore = (take.votes || []).reduce((acc, vote) => {
    if (vote.type === 'UP') return acc + 1
    if (vote.type === 'DOWN') return acc - 1
    return acc
  }, 0)

  return (
    <Card className="hover:border-foreground/10 transition-colors">
      <div className="flex">
        {/* Vote buttons */}
        <div className="flex flex-col items-center justify-start px-2 py-4">
          <VoteButtons
            takeId={take.id}
            initialVotes={take.votes || []}
            initialVoteScore={voteScore}
          />
        </div>

        {/* Take content */}
        <div className="flex-1 p-4 pt-2">
          {/* Take metadata */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link
              href={`/k/${take.community.slug}`}
              className="hover:text-foreground hover:underline"
            >
              k/{take.community.name}
            </Link>
            <span>•</span>
            <span>Shared by</span>
            <UserAvatar
              name={take.author.name || null}
              image={take.author.image || null}
              className="h-4 w-4"
            />
            <Link href={`/user/${take.author.id}`} className="hover:underline">
              {take.author.name}
            </Link>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(take.createdAt))} ago</span>
          </div>

          {/* Take title */}
          <Link href={`/take/${take.id}`}>
            <h2 className="text-lg font-semibold leading-snug hover:underline">
              {take.title}
            </h2>
          </Link>

          {/* Take content preview */}
          {take.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {take.content}
            </p>
          )}

          {/* Take actions */}
          <div className="flex items-center space-x-4">
            <Link
              href={`/take/${take.id}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <span>{take._count?.comments || 0} comments</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
} 