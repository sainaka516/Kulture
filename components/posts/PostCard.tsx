'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PostCardProps = {
  post: {
    id: string
    title: string
    content: string | null
    createdAt: Date
    author: {
      name: string | null
    }
    community: {
      name: string
    }
    _count: {
      comments: number
      votes: number
    }
  }
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm hover:shadow transition">
      <div className="p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href={`/r/${post.community.name}`} className="hover:underline font-medium">
            r/{post.community.name}
          </Link>
          <span>•</span>
          <span>Posted by {post.author.name}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
        </div>

        <Link href={`/post/${post.id}`} className="block mt-2">
          <h2 className="text-lg font-semibold leading-snug text-gray-900">
            {post.title}
          </h2>
          {post.content && (
            <p className="mt-2 text-gray-600 line-clamp-3">
              {post.content}
            </p>
          )}
        </Link>

        <div className="mt-4 flex items-center space-x-4 text-gray-500">
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className="font-medium">{post._count.votes}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>

          <Link 
            href={`/post/${post.id}`}
            className="flex items-center space-x-1 hover:text-gray-800"
          >
            <MessageSquare className="h-5 w-5" />
            <span>{post._count.comments} comments</span>
          </Link>
        </div>
      </div>
    </div>
  )
} 