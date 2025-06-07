'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { animated as a, useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Take } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, ChevronRight } from 'lucide-react'
import { formatTimeAgo } from '@/lib/date'
import Link from 'next/link'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { UserAvatar } from './ui/user-avatar'

interface SwipeableCardProps {
  take: Take
  currentKultureSlug: string | null
  onVote: (type: 'UP' | 'DOWN') => void
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

  // Calculate vote score and verification status
  const voteScore = (take.votes || []).reduce((acc, vote) => {
    if (vote.type === 'UP') return acc + 1
    if (vote.type === 'DOWN') return acc - 1
    return acc
  }, 0)

  // Check verification status for current community
  const currentMemberCount = take.community._count?.members || 0
  const requiredCurrentVotes = Math.ceil(currentMemberCount * 0.5)
  const isVerifiedInCurrent = currentMemberCount > 0 && voteScore >= requiredCurrentVotes

  // Get parent member count and verification
  const parentMemberCount = take.community.parent?._count?.members || 0
  const requiredParentVotes = Math.ceil(parentMemberCount * 0.5)
  const isVerifiedInParent = parentMemberCount > 0 && voteScore >= requiredParentVotes

  // Determine if we're viewing from parent or child context
  const isParentView = currentKultureSlug === take.community.parent?.slug
  const isChildView = currentKultureSlug === take.community.slug

  // Determine checkmark color based on verification status
  let checkmarkColor = null
  if (isChildView) {
    // On child's page: green if verified in child context
    checkmarkColor = isVerifiedInCurrent ? "text-green-500" : null
  } else if (isParentView) {
    // On parent's page:
    // Show blue if verified in parent context (>50% of parent members)
    // Show green if only verified in child context
    if (isVerifiedInParent) {
      checkmarkColor = "text-blue-500"
    } else if (isVerifiedInCurrent) {
      checkmarkColor = "text-green-500"
    }
  } else {
    // On other pages
    if (isVerifiedInParent) {
      checkmarkColor = "text-blue-500"
    } else if (isVerifiedInCurrent) {
      checkmarkColor = "text-green-500"
    }
  }

  // Get tooltip text based on verification status
  const getTooltipText = () => {
    if (isParentView) {
      if (isVerifiedInParent) {
        return `This take is verified in both ${take.community.parent?.name} (${voteScore}/${requiredParentVotes} votes) and ${take.community.name} (${voteScore}/${requiredCurrentVotes} votes)`
      } else if (isVerifiedInCurrent) {
        return `This take is verified in ${take.community.name} (${voteScore}/${requiredCurrentVotes} votes)`
      }
    } else if (isChildView) {
      if (isVerifiedInCurrent) {
        return `This take is verified in ${take.community.name} (${voteScore}/${requiredCurrentVotes} votes)`
      }
    } else {
      if (isVerifiedInParent) {
        return `This take is verified in both ${take.community.parent?.name} (${voteScore}/${requiredParentVotes} votes) and ${take.community.name} (${voteScore}/${requiredCurrentVotes} votes)`
      } else if (isVerifiedInCurrent) {
        return `This take is verified in ${take.community.name} (${voteScore}/${requiredCurrentVotes} votes)`
      }
    }
    return ''
  }

  // Check if verified in both cultures
  const isVerifiedInBoth = isVerifiedInCurrent && isVerifiedInParent

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

      const swipeThreshold = 100 // Fixed threshold in pixels
      const velocityThreshold = 0.2 // Lower velocity threshold for easier swipes

      if (active) {
        setIsDragging(true)
        api.start({ 
          x: mx, 
          rotate: mx * 0.03,
          scale: 1 - Math.abs(mx) / (windowWidth * 4),
        })
      } else {
        setIsDragging(false)
        
        // Trigger swipe if either threshold is met
        const shouldSwipeLeft = mx < -swipeThreshold || vx < -velocityThreshold
        const shouldSwipeRight = hasPrevious && (mx > swipeThreshold || vx > velocityThreshold)

        if (shouldSwipeLeft) {
          // Swipe left - next take
          api.start({
            x: -windowWidth,
            rotate: -30,
            scale: 0.8,
            onRest: () => {
              api.start({ x: 0, rotate: 0, scale: 1, immediate: true })
              onNext()
            },
          })
        } else if (shouldSwipeRight) {
          // Swipe right - previous take
          api.start({
            x: windowWidth,
            rotate: 30,
            scale: 0.8,
            onRest: () => {
              api.start({ x: 0, rotate: 0, scale: 1, immediate: true })
              onPrevious()
            },
          })
        } else {
          // Return to center
          api.start({ x: 0, rotate: 0, scale: 1 })
        }
      }
    },
    {
      from: () => [x.get(), 0],
      filterTaps: true,
      rubberband: true,
      threshold: 5, // Make it more responsive
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

  const userVote = session?.user ? take.votes.find(vote => vote.userId === session.user.id)?.type : null

  return (
    <a.div
      {...bindDrag()}
      style={{
        x,
        rotate,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="absolute inset-0 flex items-start justify-center px-4 pt-16 select-none touch-none"
    >
      <div className="absolute top-4 left-0 right-0 text-center">
        <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">SWIPE!</h2>
      </div>
      
      <Card className={cn(
        'w-full max-w-xl h-full bg-card shadow-xl rounded-xl transition-shadow overflow-y-auto mx-auto',
        isDragging && 'shadow-2xl',
        Math.abs(x.get()) > 0 && 'shadow-2xl'
      )}>
        <div className="p-6 space-y-8 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/k/${take.community.slug}`} className="hover:text-foreground hover:underline flex items-center gap-1">
              {take.community.parent ? (
                <>
                  <span className="text-muted-foreground">{take.community.parent.name}</span>
                  <span className="text-muted-foreground mx-1">{'>'}</span>
                  <span>{take.community.name}</span>
                </>
              ) : (
                take.community.name
              )}
            </Link>
            <span>•</span>
            <span>Shared by</span>
            <UserAvatar
              user={{
                image: take.author.image,
                username: take.author.username
              }}
              className="h-4 w-4"
            />
            <Link href={`/user/${take.author.id}`} className="hover:underline flex items-center gap-1">
              @{take.author.username}
              {take.author.verified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>Verified User</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Link>
            <span>•</span>
            <span>{formatTimeAgo(new Date(take.createdAt))}</span>
            {checkmarkColor && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center">
                      <CheckCircle2 className={cn("h-4 w-4", checkmarkColor)} />
                      {isVerifiedInBoth && (
                        <span className="ml-1 text-xs font-bold text-blue-500">2x</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{getTooltipText()}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Content */}
          <div className="flex-grow space-y-8">
            <Link href={`/take/${take.id}`} className="group">
              <h2 className="text-3xl font-bold leading-tight text-center flex flex-col items-center gap-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {take.title}
                {checkmarkColor && (
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 
                              className={cn(
                                "h-7 w-7", 
                                checkmarkColor,
                                "transition-colors duration-200"
                              )} 
                            />
                            {isVerifiedInBoth && (
                              <span className="text-sm font-bold text-blue-500">2x</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{getTooltipText()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </h2>
            </Link>
            {take.content && (
              <p className="text-xl text-muted-foreground leading-relaxed text-center">{take.content}</p>
            )}
          </div>
          
          {/* Footer */}
          <div className="pt-6 border-t mt-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 voting-buttons" style={{ touchAction: 'auto' }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    onVote('UP')
                  }}
                  className={cn(
                    'flex items-center gap-2 w-32',
                    userVote === 'UP' && 'bg-purple-600 hover:bg-purple-700 text-white'
                  )}
                  style={{ touchAction: 'manipulation' }}
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span className="text-lg">{(take.votes || []).filter(vote => vote.type === 'UP').length}</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    onVote('DOWN')
                  }}
                  className={cn(
                    'flex items-center gap-2 w-32',
                    userVote === 'DOWN' && 'bg-red-600 hover:bg-red-700 text-white'
                  )}
                  style={{ touchAction: 'manipulation' }}
                >
                  <ThumbsDown className="h-5 w-5" />
                  <span className="text-lg">{(take.votes || []).filter(vote => vote.type === 'DOWN').length}</span>
                </Button>
              </div>
              <Link 
                href={`/take/${take.id}`}
                className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors group"
              >
                <MessageSquare className="h-5 w-5" />
                <span>{take._count?.comments || 0} comments</span>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </a.div>
  )
}