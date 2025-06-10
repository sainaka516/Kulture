export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import FriendsClient from './friends-client'

export const metadata: Metadata = {
  title: 'Friends',
  description: 'View and manage your friends.',
}

export default function FriendsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <FriendsClient />
      </Suspense>
    </div>
  )
} 