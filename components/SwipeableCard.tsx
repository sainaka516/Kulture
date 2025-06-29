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
  isLastTake: boolean
}

export default function SwipeableCard({
  take,
  currentKultureSlug,
  onVote,
  onNext,
  onPrevious,
  hasPrevious,
  isLastTake,
}: SwipeableCardProps) {
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)

  // Set window width after mount
  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get user's current vote
  const userVote = take.votes?.find(vote => vote.userId === session?.user?.id)?.type || null

  // Calculate upvote count for verification
  const upvoteCount = (take.votes || []).filter(vote => vote.type === 'UP').length

  // Check verification status for current community
  const currentMemberCount = take.community._count?.members || 0
  const requiredCurrentVotes = Math.ceil(currentMemberCount * 0.5)
  const isVerifiedInCurrent = currentMemberCount > 0 && upvoteCount >= requiredCurrentVotes

  // Check verification status for parent community
  const parentMemberCount = take.community.parent?._count?.members || 0
  const requiredParentVotes = Math.ceil(parentMemberCount * 0.5)
  const isVerifiedInParent = parentMemberCount > 0 && upvoteCount >= requiredParentVotes

  // Check verification status for grandparent community
  const grandparentMemberCount = take.community.parent?.parent?._count?.members || 0
  const requiredGrandparentVotes = Math.ceil(grandparentMemberCount * 0.5)
  const isVerifiedInGrandparent = grandparentMemberCount > 0 && upvoteCount >= requiredGrandparentVotes

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

  // Configure spring animation
  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 500, friction: 30 },
  }))

  // Bind drag gesture
  const bindDrag = useDrag(
    ({ active, movement: [mx], velocity: [vx], target, event }) => {
      // Don't handle drag events if window width is not set yet
      if (windowWidth === 0) return

      // Check if the interaction is with a voting button or link
      const targetElement = event?.target as HTMLElement
      const isVotingInteraction = targetElement?.closest('[data-voting-button]') || targetElement?.closest('[data-voting-buttons]')
      const isLinkInteraction = targetElement?.closest('a') && !targetElement?.closest('[data-community-link]')
      
      // If it's a voting or link interaction, don't handle any drag behavior
      if (isVotingInteraction || isLinkInteraction) {
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
      const SWIPE_THRESHOLD = windowWidth * 0.25 // Increased threshold
      const VELOCITY_THRESHOLD = 0.5 // Increased threshold

      if (!active && (displacement > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD)) {
        const isSwipingLeft = mx < 0
        
        if (isSwipingLeft) {
          // Swipe left - next take (always trigger onNext to show end message)
          api.start({
            x: -windowWidth,
            rotate: -30,
            onResolve: () => {
              onNext()
              // Reset position for next take
              api.start({ x: 0, rotate: 0, scale: 1 })
            },
          })
        } else if (!isSwipingLeft && hasPrevious) {
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
          // No previous take, bounce back with more resistance
          api.start({
            x: 0,
            rotate: 0,
            scale: 1,
            config: { tension: 200, friction: 20 },
          })
        }
      } else if (!active) {
        // If not triggering navigation, reset position
        api.start({
          x: 0,
          rotate: 0,
          scale: 1,
          config: { tension: 200, friction: 20 },
        })
      }
    },
    {
      from: () => [x.get(), 0],
      filterTaps: true,
      rubberband: true,
      bounds: { left: -windowWidth, right: windowWidth },
      preventScroll: true,
      preventDefault: true,
    }
  )

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && !isLastTake) {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext, hasPrevious, isLastTake])

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
                    data-community-link
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
            <Link href={`/take/${take.id}`} className="block space-y-3 hover:opacity-75 transition-opacity">
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
            </Link>

            {/* Voting buttons */}
            <div 
              className="voting-buttons flex items-center justify-center gap-8" 
              data-voting-buttons
            >
              <Button
                variant={userVote === 'UP' ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "flex items-center gap-2 px-6 transition-colors",
                  userVote === 'UP' && "bg-purple-500 hover:bg-purple-600 text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onVote('UP')
                }}
                data-voting-button
              >
                <ThumbsUp className="h-6 w-6" />
                <span className="font-medium">{take._count.upvotes}</span>
              </Button>
              <Button
                variant={userVote === 'DOWN' ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "flex items-center gap-2 px-6 transition-colors",
                  userVote === 'DOWN' && "bg-red-500 hover:bg-red-600 text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onVote('DOWN')
                }}
                data-voting-button
              >
                <ThumbsDown className="h-6 w-6" />
                <span className="font-medium">{take._count.downvotes}</span>
              </Button>
            </div>

            {/* Comments link */}
            <div className="flex justify-center">
              <Link
                href={`/take/${take.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  window.location.href = `/take/${take.id}`
                }}
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