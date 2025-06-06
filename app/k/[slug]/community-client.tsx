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
        image: string | null
      }
      community: {
        id: string
        name: string
        slug: string
      }
      votes: Array<{
        id: string
        type: 'UP' | 'DOWN'
        userId: string
      }>
      _count: {
        comments: number
      }
    }>
    _count: {
      members: number
      takes: number
      children: number
    }
  }
}

export default function CommunityClient({ community }: CommunityClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isJoining, setIsJoining] = useState(false)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      // Check if user is already a member
      fetch(`/api/k/${community.slug}/membership`)
        .then((res) => res.json())
        .then((data) => {
          setIsMember(data.isMember)
        })
        .catch((error) => {
          console.error('Error checking membership:', error)
        })
    }
  }, [session?.user?.id, community.slug])

  function joinCommunity() {
    if (!session) {
      router.push('/sign-in')
      return
    }

    setIsJoining(true)
    fetch(`/api/k/${community.slug}/join`, {
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to join community')
        }
        return response.json()
      })
      .then(() => {
        toast({
          title: 'Success',
          description: `You have joined ${community.name}`,
        })
        setIsMember(true)
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setIsJoining(false)
      })
  }

  function leaveCommunity() {
    if (!session) {
      router.push('/sign-in')
      return
    }

    setIsJoining(true)
    fetch(`/api/k/${community.slug}/leave`, {
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to leave community')
        }
        return response.json()
      })
      .then(() => {
        toast({
          title: 'Success',
          description: `You have left ${community.name}`,
        })
        setIsMember(false)
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setIsJoining(false)
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {community.parent ? (
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/k/${community.parent.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center"
              >
                {community.parent.name}
                <span className="mx-2 text-muted-foreground">></span>
              </Link>
            </div>
          ) : null}
          <h1 className="text-2xl font-bold">{community.name}</h1>
          {community.description && (
            <p className="text-muted-foreground mt-1">{community.description}</p>
          )}
        </div>
        <Button onClick={() => router.push('/submit')}>Share Take</Button>
      </div>

      {community.children.length > 0 && (
        <KultureGrid kultures={community.children} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
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

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-4">About {community.name}</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-muted-foreground">Created by</dt>
                <dd className="font-medium">{community.owner.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Members</dt>
                <dd className="font-medium">{community._count.members}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Takes</dt>
                <dd className="font-medium">{community._count.takes}</dd>
              </div>
              {community._count.children > 0 && (
                <div>
                  <dt className="text-muted-foreground">Associated Kultures</dt>
                  <dd className="font-medium">{community._count.children}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4">
              <Button 
                onClick={isMember ? leaveCommunity : joinCommunity} 
                className="w-full" 
                disabled={isJoining}
                variant={isMember ? "outline" : "default"}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isMember ? 'Leaving...' : 'Joining...'}
                  </>
                ) : (
                  isMember ? 'Leave Kulture' : 'Join Kulture'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 