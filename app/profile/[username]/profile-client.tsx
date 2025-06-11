'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { TakesProvider } from '@/lib/contexts/TakesContext'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, Trophy, MessageSquare, Share2, Users2, Heart, Layers } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import KultureGrid from '@/components/KultureGrid'

interface ProfileClientProps {
  user: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified: boolean
    takes: Take[]
    joinedKultures: Array<{
      id: string
      name: string
      slug: string
      description: string | null
      _count: {
        members: number
        takes: number
        children: number
      }
    }>
    _count: {
      takes: number
      comments: number
      upvotes: number
      downvotes: number
    }
    createdAt: string
  }
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <Tabs defaultValue="takes">
              <TabsList>
                <TabsTrigger value="takes">Takes</TabsTrigger>
                <TabsTrigger value="kultures">Kultures</TabsTrigger>
              </TabsList>
              <TabsContent value="takes" className="mt-6">
                <TakesProvider initialTakes={user.takes}>
                  <TakeFeed
                    takes={user.takes}
                    currentKultureSlug={null}
                    defaultView="swipe"
                    showViewSwitcher={true}
                  />
                </TakesProvider>
              </TabsContent>
              <TabsContent value="kultures" className="mt-6">
                <KultureGrid kultures={user.joinedKultures} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{user._count.takes} takes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{user._count.upvotes} upvotes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users2 className="h-4 w-4" />
                    <span>{user.joinedKultures.length} kultures</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 