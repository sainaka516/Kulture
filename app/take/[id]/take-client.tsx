'use client'

import { TakesProvider } from '@/lib/contexts/TakesContext'
import TakeCard from '@/components/TakeCard'
import Comments from '@/components/Comments'
import { CommunityCard } from "@/components/CommunityCard"
import { useSession } from 'next-auth/react'
import { transformTake } from '@/lib/utils'

interface TakeClientProps {
  take: Take
  comments: Comment[]
}

export default function TakeClient({ take, comments }: TakeClientProps) {
  const { data: session } = useSession()
  const transformedTake = transformTake(take, session?.user?.id)

  return (
    <TakesProvider initialTakes={[transformedTake]}>
      <div className="container flex flex-col items-center justify-between gap-6 py-8 md:flex-row md:items-start">
        <div className="w-full md:w-3/4">
          <TakeCard take={transformedTake} currentKultureSlug={null} />
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