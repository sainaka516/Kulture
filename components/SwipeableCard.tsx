'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { animated as a, useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Take } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2 } from 'lucide-react'
import { formatTimeAgo } from '@/lib/date'
import Link from 'next/link'
import { UserAvatar } from './ui/user-avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SwipeableCardProps {
  take: Take
  currentKultureSlug: string | null
  onVote: (type: 'UP' | 'DOWN') => Promise<void>
  onNext: () => void
  onPrevious: () => void
  hasPrevious: boolean
}

export default function SwipeableCard({
  take,
  currentKultureSlug,
  onVote,
  onNext,
  onPrevious,
  hasPrevious,
}: SwipeableCardProps) {
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)

  // Set window width after mount
  useEffect(() => {
    setWindowWidth(window.innerWidth)
  }, [])

  // Get user's current vote
  const userVote = take.votes?.find(vote => vote.userId === session?.user?.id)?.type || null

  // Calculate vote score
  const voteScore = (take.votes || []).reduce((acc, vote) => {
    if (vote.type === 'UP') return acc + 1
    if (vote.type === 'DOWN') return acc - 1
    return acc
  }, 0)

  // Calculate verification status
  const currentMemberCount = take.community._count?.members || 0
  const requiredCurrentVotes = Math.ceil(currentMemberCount * 0.5)
  const isVerifiedInCurrent = currentMemberCount > 0 && voteScore >= requiredCurrentVotes

  // Get verification status for all ancestors
  const getVerifiedAncestors = () => {
    const ancestors = []
    let currentParent = take.community.parent

    while (currentParent) {
      const memberCount = currentParent._count?.members || 0
      const requiredVotes = Math.ceil(memberCount * 0.5)
      const isVerified = memberCount > 0 && voteScore >= requiredVotes

      ancestors.push({
        name: currentParent.name,
        isVerified
      })

      currentParent = currentParent.parent
    }

    return ancestors
  }

  const verifiedAncestors = getVerifiedAncestors()
  const verifiedCount = [
    isVerifiedInCurrent,
    ...verifiedAncestors.map(ancestor => ancestor.isVerified)
  ].filter(Boolean).length

  // Get tooltip text
  const getTooltipText = () => {
    const verifiedKultures = []
    if (isVerifiedInCurrent) {
      verifiedKultures.push(take.community.name)
    }
    verifiedAncestors.forEach(ancestor => {
      verifiedKultures.push(ancestor.name)
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

  // Configure spring animation
  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 500, friction: 30 },
  }))

  // Bind drag gesture
  const bindDrag = useDrag(
    ({ active, movement: [mx], velocity: [vx], target }) => {
      // Don't handle drag events if window width is not set yet
      if (windowWidth === 0) return

      // Ignore drag if the target is a button or inside the voting buttons container
      const isVotingButton = (target as HTMLElement)?.closest('.voting-buttons')
      if (isVotingButton) {
        return
      }

      setIsDragging(active)

      // Update spring with movement
      api.start({
        x: active ? mx : 0,
        rotate: active ? mx / 20 : 0,
        scale: active ? 1.1 : 1,
        immediate: name => active && name === 'x',
      })

      // If released with enough velocity or displacement, trigger navigation
      const displacement = Math.abs(mx)
      const SWIPE_THRESHOLD = windowWidth * 0.075
      const VELOCITY_THRESHOLD = 0.3

      if (!active && (displacement > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD)) {
        const isSwipingLeft = mx < 0
        
        if (isSwipingLeft) {
          // Swipe left - next take
          api.start({
            x: -windowWidth,
            rotate: -30,
            onResolve: () => {
              onNext()
              // Reset position for next take
              api.start({ x: 0, rotate: 0, scale: 1 })
            },
          })
        } else if (hasPrevious) {
          // Swipe right - previous take (only if there's a previous take)
          api.start({
            x: windowWidth,
            rotate: 30,
            onResolve: () => {
              onPrevious()
              // Reset position for next take
              api.start({ x: 0, rotate: 0, scale: 1 })
            },
          })
        } else {
          // No previous take, bounce back
          api.start({ x: 0, rotate: 0, scale: 1 })
        }
      }
    },
    {
      from: () => [x.get(), 0],
      filterTaps: true,
      rubberband: true,
    }
  )

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext, hasPrevious])

  return (
    <div className="relative">
      <a.div
        {...bindDrag()}
        style={{
          x,
          rotate,
          scale,
          touchAction: 'none',
        }}
        className="touch-none"
      >
        <Card className={cn(
          'relative overflow-hidden bg-card shadow-xl transition-shadow',
          isDragging && 'shadow-2xl',
          Math.abs(x.get()) > 0 && 'shadow-2xl'
        )}>
          <div className="p-6 space-y-6">
            {/* Author info */}
            <div className="flex items-center gap-3">
              <UserAvatar
                user={take.author}
                className="h-10 w-10"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{take.author.name || take.author.username}</span>
                  {take.author.verified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{formatTimeAgo(new Date(take.createdAt))}</span>
                  <span>·</span>
                  <Link
                    href={`/k/${take.community.slug}`}
                    className="hover:underline"
                  >
                    {take.community.parent ? (
                      <>
                        <span>{take.community.parent.name}</span>
                        <span className="mx-1">{'>'}</span>
                        <span>{take.community.name}</span>
                      </>
                    ) : (
                      take.community.name
                    )}
                  </Link>
                </div>
              </div>
            </div>

            {/* Take content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{take.title}</h2>
                {verifiedCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          <span className="text-xs font-bold text-blue-500">{verifiedCount}x</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getTooltipText()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {take.content && (
                <p className="text-muted-foreground text-lg">{take.content}</p>
              )}
            </div>

            {/* Voting buttons */}
            <div className="voting-buttons flex items-center justify-center gap-8">
              <Button
                variant={userVote === 'UP' ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "flex items-center gap-2 px-6 transition-colors",
                  userVote === 'UP' && "bg-purple-500 hover:bg-purple-600 text-white"
                )}
                onClick={() => onVote('UP')}
              >
                <ThumbsUp className="h-6 w-6" />
                <span className="font-medium">{take.votes.filter(v => v.type === 'UP').length}</span>
              </Button>
              <Button
                variant={userVote === 'DOWN' ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "flex items-center gap-2 px-6 transition-colors",
                  userVote === 'DOWN' && "bg-red-500 hover:bg-red-600 text-white"
                )}
                onClick={() => onVote('DOWN')}
              >
                <ThumbsDown className="h-6 w-6" />
                <span className="font-medium">{take.votes.filter(v => v.type === 'DOWN').length}</span>
              </Button>
            </div>

            {/* Comments link */}
            <div className="flex justify-center">
              <Link
                href={`/take/${take.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                <span>{take._count.comments} comments</span>
              </Link>
            </div>
          </div>
        </Card>
      </a.div>
    </div>
  )
}