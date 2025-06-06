'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Loader2, Trophy, Medal } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface LeaderboardUser {
  id: string
  name: string | null
  image: string | null
  points: number
  verifiedTakes: number
  multiVerifiedTakes: number
}

export default function LeaderboardClient() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(response => response.json())
      .then(data => {
        setUsers(data)
      })
      .catch(error => {
        console.error('Failed to fetch leaderboard:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user, index) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8">
              {index === 0 ? (
                <Trophy className="h-6 w-6 text-yellow-500" />
              ) : index === 1 ? (
                <Medal className="h-6 w-6 text-gray-400" />
              ) : index === 2 ? (
                <Medal className="h-6 w-6 text-amber-600" />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">
                  #{index + 1}
                </span>
              )}
            </div>
            <UserAvatar
              name={user.name}
              image={user.image}
              className="h-10 w-10"
            />
            <div className="flex-1">
              <Link
                href={`/user/${user.id}`}
                className="font-semibold hover:underline"
              >
                {user.name}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{user.verifiedTakes} Kulture Verified takes</span>
                {user.multiVerifiedTakes > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {user.multiVerifiedTakes} multi-verified
                      <Badge variant="secondary" className="h-4 px-1 text-xs">
                        2x
                      </Badge>
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-lg font-bold">
              {user.points} points
            </div>
          </div>
        </Card>
      ))}

      {users.length === 0 && (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold">No Verified Takes Yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get your takes verified by the community to appear on the leaderboard!
          </p>
        </Card>
      )}
    </div>
  )
} 