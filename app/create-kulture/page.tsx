'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function CreateKulture() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentSlug = searchParams.get('parent')
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [parentCommunities, setParentCommunities] = useState<any[]>([])
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  const fetchCommunities = useCallback(() => {
    fetch('/api/communities')
      .then((response) => response.json())
      .then((data) => {
        setParentCommunities(data)
        // If we have a parent slug, find and select the matching community
        if (parentSlug) {
          const parentCommunity = data.find((c: any) => c.slug === parentSlug)
          if (parentCommunity) {
            setSelectedParentId(parentCommunity.id)
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch communities:', error)
      })
  }, [parentSlug])

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
    const parentId = formData.get('parentId') as string || selectedParentId || null

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
            throw new Error(text || 'Failed to create kulture')
          })
        }
        return response.json()
      })
      .then((community) => {
        toast({
          title: 'Success',
          description: 'Your kulture has been created.',
        })
        router.push(`/k/${community.slug}`)
      })
      .catch((error) => {
        console.error('Error creating kulture:', error)
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
    <div className="container max-w-2xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {parentSlug ? 'Create Associated Kulture' : 'Create a Kulture'}
        </h1>
        <p className="text-muted-foreground">
          {parentSlug 
            ? `Create a new kulture that will be associated with ${parentCommunities.find((c: any) => c.slug === parentSlug)?.name || 'the selected kulture'}`
            : 'Create a new community for people to share and discuss takes'
          }
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
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
          <Label htmlFor="title">Display Title</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g., Sports Discussion"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            placeholder="What is this kulture about?"
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">Community Rules</Label>
          <Textarea
            id="rules"
            name="rules"
            placeholder="Optional: Set some ground rules for your community"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentId">Parent Kulture</Label>
          <Select 
            name="parentId" 
            value={selectedParentId || ''} 
            onValueChange={setSelectedParentId}
            disabled={!!parentSlug}
          >
            <SelectTrigger>
              <SelectValue placeholder={parentSlug ? 'Parent kulture selected' : 'Optional: Choose a parent kulture'} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Available Kultures</SelectLabel>
                {parentCommunities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {parentSlug 
              ? `This kulture will be associated with "${parentCommunities.find((c: any) => c.slug === parentSlug)?.name || 'the selected kulture'}"`
              : 'Optional: Associate this kulture with an existing one to create a hierarchy'
            }
          </p>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Kulture'
          )}
        </Button>
      </form>
    </div>
  )
} 