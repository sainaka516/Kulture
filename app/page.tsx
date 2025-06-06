'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Flame, Clock, TrendingUp } from 'lucide-react'
import SubkultureList from '@/components/SubkultureList'
import { Suspense } from 'react'
import TakeCard from '@/components/TakeCard'
import TakeFeed from '@/components/TakeFeed'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

function TakeFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [takes, setTakes] = useState([])
  const [communities, setCommunities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }

    // Fetch takes
    fetch('/api/takes')
      .then(response => response.json())
      .then(data => {
        setTakes(data)
      })
      .catch(error => {
        console.error('Failed to fetch takes:', error)
      })

    // Fetch communities
    fetch('/api/communities')
      .then(response => response.json())
      .then(data => {
        setCommunities(data)
      })
      .catch(error => {
        console.error('Failed to fetch communities:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [status, router])

  if (isLoading) {
    return <TakeFeedSkeleton />
  }

  return (
    <div className="container grid grid-cols-1 gap-y-4 md:grid-cols-3 md:gap-x-4 py-6">
      <div className="flex flex-col col-span-2 space-y-6">
        {session?.user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold">Your Feed</h1>
            </div>
            <Link href="/submit" className={buttonVariants()}>
              Share Take
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold">Recent Takes</h1>
            </div>
            <Link href="/sign-in" className={buttonVariants()}>
              Sign in to share
            </Link>
          </div>
        )}
        <Suspense fallback={<TakeFeedSkeleton />}>
          <TakeFeed initialTakes={takes} />
        </Suspense>
      </div>

      {/* Sidebar */}
      <div className="hidden md:block space-y-6">
        <SubkultureList communities={communities} />
      </div>
    </div>
  )
}
