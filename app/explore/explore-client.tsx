'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import TakeCard from '@/components/TakeCard'
import { TakesProvider } from '@/lib/contexts/TakesContext'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'

interface ExploreClientProps {
  takes: Take[]
}

export default function ExploreClient({ takes: initialTakes }: ExploreClientProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [viewedTakes, setViewedTakes] = useState<Take[]>(initialTakes)

  return (
    <div className="container py-8">
      <TakesProvider initialTakes={viewedTakes}>
        <TakeFeed
          takes={viewedTakes}
          currentKultureSlug={null}
          defaultView="swipe"
          showViewSwitcher={true}
        />
      </TakesProvider>
    </div>
  )
} 