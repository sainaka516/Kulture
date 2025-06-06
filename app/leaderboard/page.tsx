import { Suspense } from 'react'
import { Loader2, Trophy } from 'lucide-react'
import LeaderboardClient from './leaderboard-client'

export const metadata = {
  title: 'Leaderboard - Kulture',
  description: 'See who has the most Kulture Verified takes',
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border bg-card animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 bg-muted rounded" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardClient />
      </Suspense>
    </div>
  )
} 