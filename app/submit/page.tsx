'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function SubmitPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [communities, setCommunities] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  const fetchCommunities = useCallback(() => {
    fetch('/api/communities')
      .then((response) => response.json())
      .then((data) => {
        setCommunities(data)
      })
      .catch((error) => {
        console.error('Failed to fetch communities:', error)
      })
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const communityId = formData.get('communityId') as string

    fetch('/api/takes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        communityId,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to create take')
        }
        return response.json()
      })
      .then((take) => {
        toast({
          title: 'Success',
          description: 'Your take has been shared.',
        })
        router.push(`/k/${take.community.slug}`)
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl p-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Share Your Take</h1>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground mt-1">
                What's your take on this?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/create-subkulture')}
              >
                Create a Subkulture
              </Button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="communityId" className="text-sm font-medium">
                Choose a Subkulture
              </label>
              <Select name="communityId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subkulture" />
                </SelectTrigger>
                <SelectContent>
                  {communities.length > 0 ? (
                    communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.parent ? `k/${community.parent.name}/` : ''}k/{community.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No communities found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/create-subkulture')}
                        className="w-full"
                      >
                        Create a Subkulture
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder="What's your take about?"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                name="content"
                placeholder="Share your thoughts..."
                className="min-h-[200px]"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  'Share Take'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
} 