'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TakeCard from '@/components/TakeCard'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [takes, setTakes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }

    if (status === 'authenticated' && session?.user) {
      fetch(`/api/users/${session.user.id}/takes`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch takes')
          }
          return response.json()
        })
        .then((data) => {
          setTakes(data)
        })
        .catch((error) => {
          console.error('Error fetching takes:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [status, session, router])

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-2xl font-bold mb-6">Your Takes</h1>
      <div className="space-y-4">
        {takes.map((take) => (
          <TakeCard key={take.id} take={take} currentKultureSlug={null} />
        ))}
        {takes.length === 0 && (
          <p className="text-muted-foreground">You haven't shared any takes yet.</p>
        )}
      </div>
    </div>
  )
} 