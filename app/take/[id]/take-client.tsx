'use client'

import { TakesProvider } from '@/lib/contexts/TakesContext'
import { ExtendedTake } from '@/components/TakeCard'
import TakeCard from '@/components/TakeCard'
import Comments from '@/components/Comments'
import { CommunityCard } from "@/components/CommunityCard"

interface TakeClientProps {
  take: ExtendedTake
  comments: any[]
}

export default function TakeClient({ take, comments }: TakeClientProps) {
  return (
    <TakesProvider initialTakes={[take]}>
      <div className="container flex flex-col items-center justify-between gap-6 py-8 md:flex-row md:items-start">
        <div className="w-full md:w-3/4">
          <TakeCard take={take} currentKultureSlug={null} />
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