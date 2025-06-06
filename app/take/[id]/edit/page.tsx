'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Post {
  id: string
  title: string
  content: string | null
  authorId: string
}

export default function EditTakePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [take, setTake] = useState<Post | null>(null)

  useEffect(() => {
    fetch(`/api/takes/${params.id}`)
      .then((response) => response.json())
      .then((data) => {
        setTake(data)
      })
      .catch((error) => {
        console.error('Failed to fetch take:', error)
        toast({
          title: 'Error',
          description: 'Failed to load take',
          variant: 'destructive',
        })
      })
  }, [params.id, toast])

  useEffect(() => {
    // Check if the user is the author of the take
    if (!session?.user) {
      router.push('/sign-in')
      return
    }

    if (take && session.user.id && take.authorId !== session.user.id) {
      toast({
        title: 'Unauthorized',
        description: 'You can only edit your own takes',
        variant: 'destructive',
      })
      router.push(`/take/${params.id}`)
    }
  }, [take, session?.user, params.id, router, toast])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    fetch(`/api/takes/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.get('title'),
        content: formData.get('content'),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update take')
        }
        toast({
          title: 'Success',
          description: 'Your take has been updated.',
        })
        router.push(`/take/${params.id}`)
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

  function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this take?')) {
      return
    }

    setIsLoading(true)

    fetch(`/api/takes/${params.id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete take')
        }
        toast({
          title: 'Success',
          description: 'Your take has been deleted.',
        })
        router.push(`/take/${params.id}`)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!take) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Take not found</h2>
          <p className="text-muted-foreground">
            The take you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Take</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Make changes to your take
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={take.title}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                name="content"
                className="min-h-[200px]"
                defaultValue={take.content || ''}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Delete
              </Button>
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
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
} 