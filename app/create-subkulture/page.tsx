'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function CreateSubkulture() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [parentCommunities, setParentCommunities] = useState<any[]>([])

  const fetchCommunities = useCallback(() => {
    fetch('/api/communities')
      .then((response) => response.json())
      .then((data) => {
        setParentCommunities(data)
      })
      .catch((error) => {
        console.error('Failed to fetch communities:', error)
      })
  }, [])

  // Fetch existing communities for parent selection
  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const rules = formData.get('rules') as string
    const parentId = formData.get('parentId') as string || null

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    fetch('/api/communities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        slug,
        title,
        description,
        rules,
        parentId,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(text || 'Failed to create subkulture')
          })
        }
        return response.json()
      })
      .then((community) => {
        toast({
          title: 'Success',
          description: 'Your subkulture has been created.',
        })
        router.push(`/k/${community.slug}`)
      })
      .catch((error) => {
        console.error('Error creating subkulture:', error)
        toast({
          title: 'Error',
          description: error.message || 'Something went wrong. Please try again.',
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
            <h1 className="text-2xl font-bold text-foreground">Create a Subkulture</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new community for people to gather and discuss.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., sports, fashion, tech"
                pattern="^[a-zA-Z0-9_-]+$"
                title="Only letters, numbers, underscores, and hyphens are allowed"
              />
              <p className="text-xs text-muted-foreground">
                This will be used in the URL: kulture.com/k/your-name
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Display Title
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g., Sports Discussion"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                required
                placeholder="What is this subkulture about?"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="rules" className="text-sm font-medium">
                Community Rules
              </label>
              <Textarea
                id="rules"
                name="rules"
                placeholder="Optional: Set some ground rules for your community"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="parentId" className="text-sm font-medium">
                Parent Subkulture
              </label>
              <Select name="parentId">
                <SelectTrigger>
                  <SelectValue placeholder="Optional: Choose a parent subkulture" />
                </SelectTrigger>
                <SelectContent>
                  {parentCommunities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      k/{community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional: Make this a sub-community of an existing subkulture
              </p>
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
                    Creating...
                  </>
                ) : (
                  'Create Subkulture'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
} 