'use client'

import { Suspense, useState, useEffect } from 'react'
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
      name: string
      slug: string
      _count?: {
        members: number
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
    takes: Array<{
      id: string
      title: string
      content: string | null
      createdAt: string
      author: {
        id: string
        name: string | null
        username: string
        image: string | null
        verified: boolean
      }
      community: {
        id: string
        name: string
        slug: string
        parent?: {
          id: string
          name: string
          slug: string
          _count?: {
            members: number
          }
        } | null
        _count?: {
          members: number
        }
      }
      votes: Array<{
        id: string
        type: 'UP' | 'DOWN'
        userId: string
      }>
      _count: {
        comments: number
        upvotes: number
        downvotes: number
      }
      currentUserId?: string
      userVote?: 'UP' | 'DOWN' | null
    }>
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
        href={`/k/${community.parent.slug}`}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {community.parent.name}
      </Link>
      <span className="text-muted-foreground">›</span>
      <span>{community.name}</span>
    </div>
  )

  const handleJoinOrLeave = async () => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to join communities.',
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
        throw new Error(`Failed to ${isMember ? 'leave' : 'join'} community`)
      }

      setIsMember(!isMember)
      toast({
        title: 'Success',
        description: `You have ${isMember ? 'left' : 'joined'} the community.`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isMember ? 'leave' : 'join'} community. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {community.description && (
              <p className="mt-2 text-muted-foreground">{community.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleJoinOrLeave} 
              disabled={isLoading}
              variant={isMember ? "outline" : "default"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isMember ? 'Leaving...' : 'Joining...'}
                </>
              ) : (
                isMember ? 'Leave Community' : 'Join Community'
              )}
            </Button>
            <Link href={`/create-kulture?parent=${community.slug}`}>
              <Button variant="outline">
                Create Associated Kulture
              </Button>
            </Link>
            <Link href={`/submit?kulture=${community.id}`}>
              <Button>Share Take</Button>
            </Link>
          </div>
        </div>

        {/* Community Stats */}
        <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
          <MembersList 
            communityName={community.name}
            memberCount={community._count.members}
            slug={community.slug}
          />
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{community._count.takes} takes</span>
          </div>
          {community._count.children > 0 && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>{community._count.children} associated kultures</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Suspense
            fallback={
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <TakeFeed 
              initialTakes={community.takes} 
              communityId={community.id}
              communitySlug={community.slug}
            />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* About Section */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">About {community.name}</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground">Created by</dt>
                <dd className="font-medium">{community.owner.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Members</dt>
                <dd className="font-medium">{community._count.members}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Takes</dt>
                <dd className="font-medium">{community._count.takes}</dd>
              </div>
              {community._count.children > 0 && (
                <div>
                  <dt className="text-sm text-muted-foreground">Associated Kultures</dt>
                  <dd className="font-medium">{community._count.children}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Associated Kultures */}
          {community.children.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Associated Kultures</h2>
              <div className="space-y-2">
                <KultureGrid kultures={community.children} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 