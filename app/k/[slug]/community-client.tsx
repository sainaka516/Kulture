'use client'

import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import TakeFeed from '@/components/TakeFeed'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import KultureGrid from '@/components/KultureGrid'
import { Card } from '@/components/ui/card'
import { Users, MessageSquare, Layers } from 'lucide-react'
import MembersList from '@/components/MembersList'
import { transformTake } from '@/lib/utils'
import { TakesProvider } from '@/lib/contexts/TakesContext'
import { Take } from '@/lib/types'

interface CommunityClientProps {
  community: {
    id: string
    name: string
    slug: string
    description: string | null
    owner: {
      id: string
      name: string | null
      image: string | null
    }
    parent?: {
      id: string
      name: string
      slug: string
      parent?: {
        id: string
        name: string
        slug: string
        _count?: {
          members: number
          takes: number
          children: number
        }
      } | null
      _count?: {
        members: number
        takes: number
        children: number
      }
    } | null
    children: Array<{
      id: string
      name: string
      slug: string
      description: string | null
      _count: {
        members: number
        takes: number
        children: number
      }
    }>
    takes: Take[]
    _count: {
      members: number
      takes: number
      children: number
    }
  }
}

export default function CommunityClient({ community }: CommunityClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isMember, setIsMember] = useState(false)

  console.log('Community page data:', {
    name: community.name,
    id: community.id,
    parent: community.parent?.name,
    childrenCount: community.children.length,
    children: community.children.map(c => ({
      name: c.name
    })),
    takesCount: community.takes.length,
    takes: community.takes.map(t => ({
      id: t.id,
      title: t.title,
      community: t.community?.name
    }))
  })

  useEffect(() => {
    const checkMembership = async () => {
      if (!session?.user) return

      try {
        const response = await fetch(`/api/k/${community.slug}/membership`)
        if (response.ok) {
          const data = await response.json()
          setIsMember(data.isMember)
        }
      } catch (error) {
        console.error('Failed to check membership:', error)
      }
    }

    checkMembership()
  }, [session, community.slug])

  const isParentCommunity = !community.parent
  const title = isParentCommunity ? (
    community.name
  ) : (
    <div className="flex items-center gap-2">
      <Link 
        href={`/k/${community.parent?.slug}`}
        prefetch={false}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {community.parent?.name}
      </Link>
      <span className="text-muted-foreground">›</span>
      <span>{community.name}</span>
    </div>
  )

  const handleJoinOrLeave = async () => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to join Kultures.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const endpoint = isMember ? 'leave' : 'join'
      const response = await fetch(`/api/k/${community.slug}/${endpoint}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to join/leave community')
      }

      setIsMember(!isMember)
      toast({
        title: 'Success',
        description: `You have ${isMember ? 'left' : 'joined'} ${community.name}`,
      })
    } catch (error) {
      console.error('Failed to join/leave:', error)
      toast({
        title: 'Error',
        description: 'Failed to join/leave community.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const transformedTakes = community.takes.map(take => {
    const transformedTake = transformTake(take, session?.user?.id)
    
    // Calculate member counts for verification
    const currentMemberCount = take.community._count?.members || community._count.members
    const parentMemberCount = take.community.parent?._count?.members || community.parent?._count?.members || 0
    const grandparentMemberCount = take.community.parent?.parent?._count?.members || community.parent?.parent?._count?.members || 0

    // Calculate upvotes for verification
    const upvoteCount = take.votes.filter(vote => vote.type === 'UP').length
    
    // Calculate verification status for each level
    const isVerifiedInCurrent = currentMemberCount > 0 && upvoteCount >= Math.ceil(currentMemberCount * 0.5)
    const isVerifiedInParent = parentMemberCount > 0 && upvoteCount >= Math.ceil(parentMemberCount * 0.5)
    const isVerifiedInGrandparent = grandparentMemberCount > 0 && upvoteCount >= Math.ceil(grandparentMemberCount * 0.5)
    
    // Calculate total verification count
    const verifiedCount = [isVerifiedInCurrent, isVerifiedInParent, isVerifiedInGrandparent].filter(Boolean).length

    return {
      ...transformedTake,
      updatedAt: transformedTake.createdAt,
      communityId: take.community.id,
      authorId: transformedTake.author.id,
      userVote: take.votes.find(vote => vote.userId === session?.user?.id)?.type || null,
      _count: {
        ...transformedTake._count,
        upvotes: upvoteCount,
        downvotes: take.votes.filter(vote => vote.type === 'DOWN').length,
      },
      community: {
        ...take.community,
        _count: {
          ...take.community._count,
          members: currentMemberCount
        },
        parent: take.community.parent ? {
          ...take.community.parent,
          _count: {
            ...take.community.parent._count,
            members: parentMemberCount
          },
          parent: take.community.parent.parent ? {
            ...take.community.parent.parent,
            _count: {
              ...take.community.parent.parent._count,
              members: grandparentMemberCount
            }
          } : null
        } : null
      },
      votes: take.votes.map(vote => ({
        ...vote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      verifiedCount
    }
  })

  return (
    <TakesProvider initialTakes={transformedTakes}>
      <div className="container py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              {community.description && (
                <p className="mt-2 text-muted-foreground">{community.description}</p>
              )}
            </div>
            <Button
              onClick={handleJoinOrLeave}
              disabled={isLoading}
              variant={isMember ? 'outline' : 'default'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isMember ? (
                'Leave'
              ) : (
                'Join'
              )}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{community._count.members}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{community._count.takes}</div>
                <div className="text-sm text-muted-foreground">Takes</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{community._count.children}</div>
                <div className="text-sm text-muted-foreground">Subkultures</div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div>
              <TakesProvider initialTakes={community.takes}>
                <TakeFeed
                  takes={community.takes}
                  currentKultureSlug={community.slug}
                  defaultView="swipe"
                  showViewSwitcher={true}
                />
              </TakesProvider>
            </div>
            <div className="space-y-6">
              {community.children.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-semibold">Subkultures</h2>
                  <div className="grid gap-4">
                    {community.children.map((child) => (
                      <Link key={child.id} href={`/k/${child.slug}`} className="block">
                        <Card className="p-4 hover:bg-muted/50 transition-colors">
                          <h3 className="font-semibold">{child.name}</h3>
                          {child.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {child.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <div>{child._count.members} members</div>
                            <div>{child._count.takes} takes</div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TakesProvider>
  )
} 