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
import { Take, Vote } from '@prisma/client'
import { Community } from '@prisma/client'
import { User } from '@prisma/client'
import { format } from "date-fns"
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { useTakes } from '@/lib/contexts/TakesContext'
import { useState, useEffect } from 'react'

interface SimpleCommunity {
  id: string;
  name: string;
  slug: string;
  _count?: {
    takes: number;
    children: number;
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
        takes: number;
        children: number;
        members: number;
      };
    } | null;
    _count?: {
      takes: number;
      children: number;
      members: number;
    };
  } | null;
  children?: SimpleCommunity[];
}

export type ExtendedTake = {
  id: string
  title: string
  content: string | null
  createdAt: string | Date
  updatedAt: string | Date
  communityId: string
  authorId: string
  community: {
    id: string
    name: string
    slug: string
    parent?: {
      id: string
      name: string
      slug: string
      parent?: {
        id: string
        name: string
        slug: string
        _count?: {
          takes: number
          children: number
          members: number
        }
      } | null
      _count?: {
        takes: number
        children: number
        members: number
      }
    } | null
    _count: {
      takes: number
      children: number
      members: number
    }
  }
  author: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified: boolean
  }
  votes: (Vote & {
    createdAt: string | Date
    updatedAt: string | Date
  })[]
  _count: {
    upvotes: number
    downvotes: number
    comments: number
  }
  userVote?: "UP" | "DOWN" | null
}

interface TakeCardProps {
  take: ExtendedTake;
  onVote?: (takeId: string, type: 'UP' | 'DOWN') => Promise<void>;
  showCommunity?: boolean;
  currentKultureSlug?: string | null;
  onViewed?: () => void;
  showDeleteButton?: boolean;
  onDelete?: (takeId: string) => void;
}

export default function TakeCard({ take: initialTake, currentKultureSlug, onVote: propOnVote, showDeleteButton = false, onDelete }: TakeCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { updateTake } = useTakes()
  const [take, setTake] = useState(initialTake)
  const isAuthor = session?.user?.id === take.authorId
  


  // Update local state when initialTake changes
  useEffect(() => {
    setTake(initialTake)
  }, [initialTake])

  // Handle voting
  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote.',
        variant: 'destructive',
      })
      return
    }

    try {
      // If onVote prop is provided, use it
      if (propOnVote) {
        await propOnVote(take.id, type)
        return
      }

      // Otherwise, handle vote directly
      const response = await fetch(`/api/takes/${take.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const updatedTake = await response.json()

      // Update both local state and context
      const newTakeState = {
        ...take,
        ...updatedTake,
        votes: updatedTake.votes,
        userVote: updatedTake.userVote,
        _count: {
          ...take._count || {},
          ...updatedTake._count || {},
          upvotes: updatedTake.votes.filter((v: Vote) => v.type === 'UP').length,
          downvotes: updatedTake.votes.filter((v: Vote) => v.type === 'DOWN').length,
        },
      }
      setTake(newTakeState)
      updateTake(newTakeState)

      // Only show success message if the vote was added or changed
      const existingVote = take.votes.find(v => v.userId === session.user.id)?.type
      const isRemovingVote = existingVote === type
      if (!isRemovingVote) {
        toast({
          title: 'Success',
          description: `You ${type === 'UP' ? 'agreed with' : 'disagreed with'} this take`,
        })
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: 'Error',
        description: 'Failed to vote. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to delete takes.',
        variant: 'destructive',
      })
      return
    }

    if (!window.confirm('Are you sure you want to delete this take? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/takes/${take.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete take')
      }

      toast({
        title: 'Success',
        description: 'Your take has been deleted.',
      })

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(take.id)
      }
    } catch (error) {
      console.error('Error deleting take:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete take. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Calculate upvote count for verification
  const upvoteCount = take._count?.upvotes || 0

  // Calculate member counts for verification
  const currentMemberCount = take.community._count?.members || 0
  const parentMemberCount = take.community.parent?._count?.members || 0
  const grandparentMemberCount = take.community.parent?.parent?._count?.members || 0

  // Calculate verification status for each level
  const isVerifiedInCurrent = currentMemberCount > 0 && upvoteCount >= Math.ceil(currentMemberCount * 0.5)
  const isVerifiedInParent = parentMemberCount > 0 && upvoteCount >= Math.ceil(parentMemberCount * 0.5)
  const isVerifiedInGrandparent = grandparentMemberCount > 0 && upvoteCount >= Math.ceil(grandparentMemberCount * 0.5)

  // Calculate total verification count
  const verifiedCount = [isVerifiedInCurrent, isVerifiedInParent, isVerifiedInGrandparent].filter(Boolean).length

  // Get tooltip text
  const getTooltipText = () => {
    const verifiedKultures = []
    if (isVerifiedInCurrent) {
      verifiedKultures.push(take.community.name)
    }
    if (isVerifiedInParent && take.community.parent) {
      verifiedKultures.push(take.community.parent.name)
    }
    if (isVerifiedInGrandparent && take.community.parent?.parent) {
      verifiedKultures.push(take.community.parent.parent.name)
    }

    if (verifiedKultures.length === 0) {
      return ''
    }

    if (verifiedKultures.length === 1) {
      return `This take is verified in ${verifiedKultures[0]} (${upvoteCount} votes)`
    }

    const lastKulture = verifiedKultures.pop()
    return `This take is verified in ${verifiedKultures.join(', ')} and ${lastKulture} (${upvoteCount} votes)`
  }

  // Set verification badge text to show total number of verified Kultures
  const verificationBadgeText = verifiedCount > 0 ? `${verifiedCount}x` : ""

  // Determine if we're viewing from parent or sibling context
  const isParentView = currentKultureSlug === take.community.parent?.slug
  const isChildView = currentKultureSlug === take.community.slug
  const isSiblingView = take.community.parent?.id === take.community.parent?.id && !isParentView && !isChildView

  // Determine checkmark color - always blue for verification
  const checkmarkColor = verifiedCount > 0 ? "text-blue-500" : null

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
              onClick={() => handleVote('UP')}
              data-voting-button="up"
              data-take-id={take.id}
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
              onClick={() => handleVote('DOWN')}
              data-voting-button="down"
              data-take-id={take.id}
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
                <Link href={`/user/${take.author.id}`} className="hover:opacity-80 transition-opacity">
                  <UserAvatar user={take.author} />
                </Link>
                <div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/user/${take.author.id}`}
                      className="text-sm font-medium hover:text-purple-600 transition-colors"
                    >
                      {take.author.name}
                    </Link>
                    {take.author.verified && (
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link 
                      href={`/user/${take.author.id}`}
                      className="hover:text-foreground transition-colors"
                    >
                      @{take.author.username}
                    </Link>
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
                  {showDeleteButton && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onSelect={handleDelete}
                      >
                        Delete Take
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <div className="mt-4">
            <Link href={`/take/${take.id}`} prefetch={false}>
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
                prefetch={false}
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