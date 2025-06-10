'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MoveTakeDialog from './MoveTakeDialog'
import { Take } from '@prisma/client'
import { Community } from '@prisma/client'
import { Vote } from '@prisma/client'
import { User } from '@prisma/client'

interface SimpleCommunity {
  id: string;
  name: string;
  slug: string;
  _count?: {
    members: number;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
      _count?: {
        members: number;
      };
    } | null;
    _count?: {
      members: number;
    };
  } | null;
  children?: SimpleCommunity[];
}

interface ExtendedTake extends Omit<Take, 'community' | 'votes' | 'createdAt' | 'updatedAt'> {
  community: SimpleCommunity;
  votes: Array<Omit<Vote, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    verified: boolean;
  };
  _count: {
    comments: number;
    upvotes: number;
    downvotes: number;
  };
  currentUserId?: string;
  userVote?: 'UP' | 'DOWN' | null;
}

interface TakeCardProps {
  take: ExtendedTake;
  onVote?: (takeId: string, type: 'UP' | 'DOWN') => Promise<void>;
  showCommunity?: boolean;
  currentKultureSlug?: string | null;
  onViewed?: () => void;
}

export default function TakeCard({ take, currentKultureSlug, onVote }: TakeCardProps) {
  const isAuthor = take.author.id === take.currentUserId

  // Calculate vote score with null check
  const voteScore = (take.votes || []).reduce((acc, vote) => {
    if (vote.type === 'UP') return acc + 1
    if (vote.type === 'DOWN') return acc - 1
    return acc
  }, 0)

  // Check verification status for current community
  const currentMemberCount = take.community._count?.members || 0
  const requiredCurrentVotes = Math.ceil(currentMemberCount * 0.5)
  const isVerifiedInCurrent = currentMemberCount > 0 && voteScore >= requiredCurrentVotes

  console.log('Take details:', {
    takeId: take.id,
    title: take.title,
    community: {
      name: take.community.name,
      parent: take.community.parent?.name,
      memberCount: take.community._count?.members
    },
    voteScore,
    verificationDetails: {
      currentMemberCount,
      requiredCurrentVotes,
      isVerifiedInCurrent,
      community: take.community.name,
      parentCommunity: take.community.parent?.name
    }
  })

  // Get verification status for all ancestors (parent chain)
  const getVerifiedAncestors = (community: SimpleCommunity): { name: string; isVerified: boolean }[] => {
    const ancestors = []
    let currentParent = community.parent

    while (currentParent) {
      const memberCount = currentParent._count?.members || 0
      const requiredVotes = Math.ceil(memberCount * 0.5)
      const isVerified = memberCount > 0 && voteScore >= requiredVotes

      ancestors.push({
        name: currentParent.name,
        isVerified
      })

      // Move up to the next parent in the chain
      currentParent = currentParent.parent
    }

    // Debug log for ancestor verification
    console.log('Ancestor verification:', {
      takeId: take.id,
      title: take.title,
      ancestors: ancestors.map(a => ({
        name: a.name,
        isVerified: a.isVerified,
      }))
    })

    return ancestors
  }

  // Get verification status for all descendants (if we're in a parent Kulture)
  const getVerifiedDescendants = (community: SimpleCommunity): { name: string; isVerified: boolean }[] => {
    // Only check descendants if we're viewing from a parent Kulture
    // and the take belongs to one of its descendants
    if (!currentKultureSlug || !take.community.parent) {
      return []
    }

    // Check if we're viewing from a parent Kulture
    const isViewingFromParent = currentKultureSlug === take.community.parent.slug

    if (!isViewingFromParent) {
      return []
    }

    const verifiedInThisLevel = (community.children || []).map(child => {
      // Only check verification for the child community that contains this take
      if (child.id === take.community.id) {
        const memberCount = child._count?.members || 0
        const requiredVotes = Math.ceil(memberCount * 0.5)
        const isVerified = memberCount > 0 && voteScore >= requiredVotes
        
        return [{ name: child.name, isVerified }]
      }
      return []
    }).flat()

    return verifiedInThisLevel
  }

  const verifiedDescendants = getVerifiedDescendants(take.community)
  const verifiedAncestors = getVerifiedAncestors(take.community)

  // Calculate total number of Kultures where the take is verified
  const verifiedCount = [
    isVerifiedInCurrent,
    ...verifiedAncestors.map(ancestor => ancestor.isVerified),
    ...verifiedDescendants.map(desc => desc.isVerified)
  ].filter(Boolean).length

  // Get tooltip text based on verification status
  const getTooltipText = () => {
    const verifiedKultures = []
    if (isVerifiedInCurrent) {
      verifiedKultures.push(take.community.name)
    }
    // Add all verified ancestors
    verifiedAncestors.forEach(ancestor => {
      if (ancestor.isVerified) {
        verifiedKultures.push(ancestor.name)
      }
    })
    // Add all verified descendants
    verifiedDescendants.forEach(desc => {
      if (desc.isVerified) {
        verifiedKultures.push(desc.name)
      }
    })

    if (verifiedKultures.length === 0) {
      return ''
    }

    if (verifiedKultures.length === 1) {
      return `This take is verified in ${verifiedKultures[0]} (${voteScore} votes)`
    }

    const lastKulture = verifiedKultures.pop()
    return `This take is verified in ${verifiedKultures.join(', ')} and ${lastKulture} (${voteScore} votes)`
  }

  // Debug logging
  console.log('Take verification details:', {
    takeId: take.id,
    communityName: take.community.name,
    voteScore,
    currentMemberCount,
    requiredCurrentVotes,
    isVerifiedInCurrent,
    parentChain: {
      parent: take.community.parent ? {
        name: take.community.parent.name,
        memberCount: take.community.parent._count?.members,
        requiredVotes: take.community.parent._count?.members ? Math.ceil(take.community.parent._count.members * 0.5) : null,
        isVerified: take.community.parent._count?.members ? voteScore >= Math.ceil(take.community.parent._count.members * 0.5) : false
      } : null,
      grandparent: take.community.parent?.parent ? {
        name: take.community.parent.parent.name,
        memberCount: take.community.parent.parent._count?.members,
        requiredVotes: take.community.parent.parent._count?.members ? Math.ceil(take.community.parent.parent._count.members * 0.5) : null,
        isVerified: take.community.parent.parent._count?.members ? voteScore >= Math.ceil(take.community.parent.parent._count.members * 0.5) : false
      } : null
    },
    verifiedDescendants: verifiedDescendants.map(desc => ({ name: desc.name, isVerified: desc.isVerified })),
    verifiedCount,
    verificationBadgeText: verifiedCount > 0 ? `${verifiedCount}x` : "",
    votes: take.votes.map(v => ({ type: v.type, userId: v.userId })),
    upvotes: take.votes.filter(v => v.type === 'UP').length,
    downvotes: take.votes.filter(v => v.type === 'DOWN').length
  })

  // Determine if we're viewing from parent or sibling context
  const isParentView = currentKultureSlug === take.community.parent?.slug
  const isChildView = currentKultureSlug === take.community.slug
  const isSiblingView = take.community.parent?.id === take.community.parent?.id && !isParentView && !isChildView

  // Determine checkmark color - always blue for verification
  const checkmarkColor = verifiedCount > 0 ? "text-blue-500" : null

  // Set verification badge text to show total number of verified Kultures
  const verificationBadgeText = verifiedCount > 0 ? `${verifiedCount}x` : ""

  const userVoteType = take.userVote || null // Ensure userVote is never undefined

  return (
    <Card className="relative overflow-hidden">
      <div className="flex min-h-[200px]">
        {/* Vote buttons */}
        <div className="px-4 flex items-center justify-center border-r">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant={take.userVote === 'UP' ? 'default' : 'outline'}
              size="lg"
              className={cn(
                "flex items-center gap-2 px-6 transition-colors",
                take.userVote === 'UP' && "bg-purple-500 hover:bg-purple-600 text-white"
              )}
              onClick={() => onVote?.(take.id, 'UP')}
            >
              <ThumbsUp className="h-6 w-6" />
              <span className="font-medium">{take._count.upvotes}</span>
            </Button>
            <Button
              variant={take.userVote === 'DOWN' ? 'default' : 'outline'}
              size="lg"
              className={cn(
                "flex items-center gap-2 px-6 transition-colors",
                take.userVote === 'DOWN' && "bg-red-500 hover:bg-red-600 text-white"
              )}
              onClick={() => onVote?.(take.id, 'DOWN')}
            >
              <ThumbsDown className="h-6 w-6" />
              <span className="font-medium">{take._count.downvotes}</span>
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserAvatar user={take.author} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{take.author.name}</span>
                    {take.author.verified && (
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>@{take.author.username}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(take.createdAt))} ago</span>
                    <span>·</span>
                    <Link
                      href={`/k/${take.community.slug}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {take.community.name}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <MoveTakeDialog
                    takeId={take.id}
                    currentKultureId={take.community.id}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Move Take
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Delete Take
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <div className="mt-4">
            <Link href={`/take/${take.id}`}>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold mb-2 hover:underline">
                  {take.title}
                </h2>
                {checkmarkColor && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          {verificationBadgeText && (
                            <span className="text-xs font-bold text-blue-500">{verificationBadgeText}</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getTooltipText()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </Link>
            {take.content && (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {take.content}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-muted-foreground">
              <Link
                href={`/take/${take.id}`}
                className="flex items-center space-x-2 hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{take._count.comments} comments</span>
              </Link>
            </div>
            {isAuthor && (
              <div className="flex items-center space-x-2">
                <MoveTakeDialog
                  takeId={take.id}
                  currentKultureId={take.community.id}
                  trigger={
                    <Button variant="outline" size="sm">
                      Move to Different Kulture
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}