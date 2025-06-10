'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import TakeCard from '@/components/TakeCard'
import { TakesProvider } from '@/lib/contexts/TakesContext'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, Trophy, MessageSquare, Share2, Users2, Heart, Layers } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import FriendRequestButton from '@/components/FriendRequestButton'
import UsernameEditor from '@/components/UsernameEditor'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface UserProfileProps {
  currentUser: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified: boolean
    takes: Take[]
  }
  session: any | null
  showEmail: boolean
}

export default function UserProfile({ currentUser, session, showEmail }: UserProfileProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{currentUser.name || currentUser.username}</h1>
            <p className="text-muted-foreground">@{currentUser.username}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Takes</h2>
            <TakesProvider initialTakes={currentUser.takes}>
              <TakeFeed
                takes={currentUser.takes}
                currentKultureSlug={null}
              />
            </TakesProvider>
          </div>
        </div>
      </div>
    </div>
  )
} 