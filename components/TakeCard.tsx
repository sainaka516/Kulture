'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import VoteButtons from '@/components/VoteButtons'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    _count?: {
      members: number
    }
    parent?: {
      id: string
      name: string
      slug: string
      _count?: {
        members: number
      }
    } | null
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
  currentKultureSlug?: string // Add this prop to know which Kulture page we're on
}

export default function TakeCard({ take, currentKultureSlug }: TakeCardProps) {
  // Calculate vote score with null check
  const voteScore = (take.votes || []).reduce((acc, vote) => {
    if (vote.type === 'UP') return acc + 1
    if (vote.type === 'DOWN') return acc - 1
    return acc
  }, 0)

  // Check verification status for current community (the community where the take was posted)
  const currentMemberCount = take.community._count?.members || 0
  const isVerifiedInCurrent = currentMemberCount > 0 && voteScore >= Math.ceil(currentMemberCount * 0.5)

  // Get parent member count and verification
  const parentMemberCount = take.community.parent?._count?.members || 0
  const requiredParentVotes = Math.ceil(parentMemberCount * 0.5)
  const isVerifiedInParent = parentMemberCount > 0 && voteScore >= requiredParentVotes

  // Debug logs
  console.log('Take:', {
    takeId: take.id,
    communityName: take.community.name,
    voteScore,
    currentMemberCount,
    parentMemberCount,
    requiredParentVotes,
    isVerifiedInParent,
    isVerifiedInCurrent,
    parentName: take.community.parent?.name,
    parentMemberCount: take.community.parent?._count?.members
  })

  // Determine if we're viewing from parent or child context
  const isParentView = currentKultureSlug === take.community.parent?.slug
  const isChildView = currentKultureSlug === take.community.slug

  // Determine checkmark color based on context and verification status
  const getCheckmarkColor = () => {
    if (isChildView) {
      // On child's page: green if verified in child context
      return isVerifiedInCurrent ? "text-green-500" : null
    } else if (isParentView) {
      // On parent's page:
      // Show green if verified in parent context (>50% of parent members)
      // Show blue if only verified in child context
      if (isVerifiedInParent) {
        return "text-green-500"
      } else if (isVerifiedInCurrent) {
        return "text-blue-500"
      }
      return null
    } else {
      // On other pages
      if (isVerifiedInParent) {
        return "text-green-500"
      } else if (isVerifiedInCurrent) {
        return "text-blue-500"
      }
      return null
    }
  }

  // Get tooltip text based on context and verification status
  const getTooltipText = () => {
    if (isChildView) {
      if (isVerifiedInCurrent) {
        return "Verified in this Kulture"
      }
    } else if (isParentView) {
      if (isVerifiedInParent) {
        return "Verified in this Kulture"
      } else if (isVerifiedInCurrent) {
        return `Verified in ${take.community.name}`
      }
    } else {
      if (isVerifiedInParent) {
        return `Verified in ${take.community.parent?.name || ''}`
      } else if (isVerifiedInCurrent) {
        return `Verified in ${take.community.name}`
      }
    }
    return "Not verified"
  }

  const checkmarkColor = getCheckmarkColor()

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
              className="hover:text-foreground hover:underline flex items-center gap-1"
            >
              {take.community.parent ? (
                <>
                  <span className="text-muted-foreground">{take.community.parent.name}</span>
                  <span className="text-muted-foreground mx-1">></span>
                  <span>{take.community.name}</span>
                </>
              ) : (
                take.community.name
              )}
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
            <h2 className="text-lg font-semibold leading-snug hover:underline flex items-center gap-2">
              {take.title}
              {checkmarkColor && (
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={cn("h-5 w-5", checkmarkColor)} />
                          {isParentView && !isChildView && (
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              {isVerifiedInParent ? 2 : 1}x
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getTooltipText()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
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