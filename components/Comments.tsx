'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
  }
}

interface CommentsProps {
  takeId: string
  initialComments: Comment[]
}

export default function Comments({ takeId, initialComments }: CommentsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const content = formData.get('content')

    if (!content) {
      toast({
        title: 'Error',
        description: 'Comment content is required',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      return
    }

    fetch(`/api/takes/${takeId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to submit comment')
        }
        return response.json()
      })
      .then((comment) => {
        setComments((prev) => [comment, ...prev])
        form.reset()
        toast({
          title: 'Success',
          description: 'Your comment has been posted.',
        })
      })
      .catch((error) => {
        console.error('Comment submission error:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit comment. Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Comments</h2>

      {session?.user ? (
        <form ref={formRef} onSubmit={onSubmit}>
          <div className="space-y-4">
            <Textarea
              name="content"
              placeholder="What are your thoughts?"
              required
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Please{' '}
            <Link href="/sign-in" className="text-foreground hover:underline">
              sign in
            </Link>{' '}
            to leave a comment.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <UserAvatar
                name={comment.author.name || null}
                image={comment.author.image || null}
                className="h-6 w-6"
              />
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">{comment.author.name}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt))} ago
                </span>
              </div>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No comments yet. Be the first to share what you think!
          </p>
        )}
      </div>
    </div>
  )
} 