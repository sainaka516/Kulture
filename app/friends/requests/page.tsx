export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import RequestsClient from './requests-client'

export const metadata: Metadata = {
  title: 'Friend Requests',
  description: 'View and manage your friend requests.',
}

export default function RequestsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <RequestsClient />
      </Suspense>
    </div>
  )
} 