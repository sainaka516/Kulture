'use client'

import { TakesProvider } from '@/lib/contexts/TakesContext'
import TakeCard from '@/components/TakeCard'
import Comments from '@/components/Comments'
import { CommunityCard } from "@/components/CommunityCard"
import { Take, Comment, Vote } from '@/lib/types'

interface TakeClientProps {
  take: Take
  comments: Comment[]
}

export default function TakeClient({ take, comments }: TakeClientProps) {
  // Ensure vote type is correct
  const takeWithCorrectVoteType: Take = {
    ...take,
    votes: take.votes.map(vote => ({
      ...vote,
      type: vote.type as 'UP' | 'DOWN',
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt
    }))
  }

  return (
    <TakesProvider initialTakes={[takeWithCorrectVoteType]}>
      <div className="container flex flex-col items-center justify-between gap-6 py-8 md:flex-row md:items-start">
        <div className="w-full md:w-3/4">
          <TakeCard take={takeWithCorrectVoteType} currentKultureSlug={null} />
          <div className="mt-6">
            <Comments takeId={take.id} initialComments={comments} />
          </div>
        </div>
        <div className="w-full md:w-1/4">
          <CommunityCard community={take.community} />
        </div>
      </div>
    </TakesProvider>
  )
} 