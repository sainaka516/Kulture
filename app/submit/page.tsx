'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
import { Label } from '@/components/ui/label'

export default function SubmitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedKultureId = searchParams.get('kulture')
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [communities, setCommunities] = useState<any[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(selectedKultureId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  const fetchCommunities = useCallback(() => {
    console.log('Fetching communities...')
    fetch('/api/communities')
      .then((response) => response.json())
      .then((data) => {
        console.log('Communities loaded:', data)
        setCommunities(data)
      })
      .catch((error) => {
        console.error('Failed to fetch communities:', error)
      })
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  // Reset form when component mounts
  useEffect(() => {
    // Reset form state when component mounts
    setTitle('')
    setContent('')
    setIsLoading(false)
  }, [])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    console.log('Form submitted!')
    console.log('Event:', event)
    console.log('Current form state:', { title, content, selectedCommunityId })
    event.preventDefault()
    setIsLoading(true)

    // Use state values instead of form data
    const communityId = selectedCommunityId

    console.log('Form data:', { title, content, communityId })

    // Validate required fields
    if (!title || !content || !communityId) {
      console.log('Missing required fields:', { title, content, communityId })
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    console.log('Sending request to /api/takes')
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
      .then(async (response) => {
        console.log('Response status:', response.status)
        if (!response.ok) {
          const errorText = await response.text()
          console.log('Error response:', errorText)
          throw new Error(errorText || 'Failed to create take')
        }
        return response.json()
      })
      .then((take) => {
        console.log('Take created successfully:', take)
        toast({
          title: 'Success',
          description: 'Your take has been shared.',
        })
        // Clear the form and redirect
        console.log('Form cleared, redirecting to:', `/k/${take.community.slug}`)
        setTitle('')
        setContent('')
        setSelectedCommunityId(null)
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
                onClick={() => router.push('/create-kulture')}
              >
                Create a Kulture
              </Button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" id="submit-form">
            <div className="space-y-2">
              <Label htmlFor="communityId">Choose a Kulture</Label>
              <Select 
                name="communityId" 
                required
                value={selectedCommunityId || ''}
                onValueChange={setSelectedCommunityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a kulture" />
                </SelectTrigger>
                <SelectContent>
                  {communities.length > 0 ? (
                    communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.parent ? `${community.parent.name} > ${community.name}` : community.name}
                      </SelectItem>
                    ))
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => router.push('/create-kulture')}
                    >
                      Create a Kulture
                    </Button>
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
                value={title}
                onChange={(e) => {
                  console.log('Title onChange:', e.target.value)
                  setTitle(e.target.value)
                }}
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
                value={content}
                onChange={(e) => {
                  console.log('Textarea onChange:', e.target.value)
                  setContent(e.target.value)
                }}
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
              <Button 
                type="submit" 
                disabled={isLoading}
              >
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