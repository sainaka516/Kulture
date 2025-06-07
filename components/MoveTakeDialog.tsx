'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'

interface MoveTakeDialogProps {
  takeId: string
  currentKultureId: string
  trigger?: React.ReactNode
}

interface Community {
  id: string
  name: string
  parent?: {
    name: string
  } | null
  displayName: string
}

export default function MoveTakeDialog({
  takeId,
  currentKultureId,
  trigger,
}: MoveTakeDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('')

  // Fetch available communities
  useEffect(() => {
    fetch('/api/communities')
      .then((res) => res.json())
      .then((data) => setCommunities(data))
      .catch((error) => {
        console.error('Failed to fetch communities:', error)
        toast({
          title: 'Error',
          description: 'Failed to load available kultures.',
          variant: 'destructive',
        })
      })
  }, [toast])

  // Filter communities based on search
  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.parent?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMove = async () => {
    if (!selectedCommunityId) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/takes/${takeId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId: selectedCommunityId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to move take')
      }

      toast({
        title: 'Success',
        description: 'Take moved successfully.',
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error moving take:', error)
      toast({
        title: 'Error',
        description: 'Failed to move take. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="ghost">Move Take</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Take</DialogTitle>
          <DialogDescription>
            Choose a new kulture for your take. This will move the take and all its
            comments to the selected kulture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="search"
              placeholder="Search kultures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={selectedCommunityId}
            onValueChange={setSelectedCommunityId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a kulture" />
            </SelectTrigger>
            <SelectContent>
              {filteredCommunities.map((community) => (
                <SelectItem
                  key={community.id}
                  value={community.id}
                  disabled={community.id === currentKultureId}
                >
                  {community.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleMove}
            disabled={!selectedCommunityId || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              'Move Take'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 