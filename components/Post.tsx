'use client'

import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PostProps {
  id: string
  title: string
  content: string
  authorName: string
  communityName: string
  createdAt: Date
  voteCount: number
  commentCount: number
}

export default function Post({
  id,
  title,
  content,
  authorName,
  communityName,
  createdAt,
  voteCount,
  commentCount,
}: PostProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Vote buttons */}
      <div className="flex">
        <div className="w-10 bg-gray-50 rounded-l-lg p-2 flex flex-col items-center">
          <button className="text-gray-400 hover:text-orange-500">
            <ArrowBigUp className="h-6 w-6" />
          </button>
          <span className="text-sm font-medium my-1">{voteCount}</span>
          <button className="text-gray-400 hover:text-blue-500">
            <ArrowBigDown className="h-6 w-6" />
          </button>
        </div>

        {/* Post content */}
        <div className="p-4 flex-1">
          {/* Post metadata */}
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Link href={`/r/${communityName}`} className="font-medium text-black hover:underline">
              r/{communityName}
            </Link>
            <span className="mx-1">•</span>
            <span>Posted by</span>
            <Link href={`/u/${authorName}`} className="ml-1 hover:underline">
              u/{authorName}
            </Link>
            <span className="mx-1">•</span>
            <span>{formatDistanceToNow(createdAt)} ago</span>
          </div>

          {/* Post title and content */}
          <Link href={`/r/${communityName}/comments/${id}`}>
            <h2 className="text-lg font-medium mb-2 hover:underline">{title}</h2>
          </Link>
          <p className="text-gray-800 mb-4 line-clamp-3">{content}</p>

          {/* Post actions */}
          <div className="flex items-center space-x-4 text-gray-500">
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">{commentCount} Comments</span>
            </button>
            <button className="flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 