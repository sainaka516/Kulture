'use client'

import { useState, useEffect } from 'react'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, RefreshCw } from 'lucide-react'

interface ExploreClientProps {
  initialTakes: Take[]
}

export default function ExploreClient({ initialTakes }: ExploreClientProps) {
  const [takes, setTakes] = useState<Take[]>(initialTakes)
  const [viewedTakes, setViewedTakes] = useState<Take[]>([])
  const [showingHistory, setShowingHistory] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Mark a take as viewed
  const markTakeAsViewed = async (takeId: string) => {
    try {
      await fetch('/api/takes/viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ takeId }),
      })
    } catch (error) {
      console.error('Error marking take as viewed:', error)
    }
  }

  // Load more takes
  const loadMoreTakes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/takes?page=${page + 1}`)
      const newTakes = await response.json()
      
      if (newTakes.length > 0) {
        setTakes(prev => [...prev, ...newTakes])
        setPage(prev => prev + 1)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more takes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load viewed takes
  const loadViewedTakes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/takes/viewed?page=${page}&limit=10`)
      const data = await response.json()
      if (page === 1) {
        setViewedTakes(data.takes)
      } else {
        setViewedTakes(prev => [...prev, ...data.takes])
      }
      setHasMore(page < data.totalPages)
    } catch (error) {
      console.error('Error loading viewed takes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to load viewed takes when showing history
  useEffect(() => {
    if (showingHistory) {
      loadViewedTakes()
    }
  }, [showingHistory, page])

  // Handle switching views
  const toggleHistory = () => {
    setShowingHistory(!showingHistory)
    setPage(1) // Reset page when switching views
  }

  // Handle refreshing takes
  const refreshTakes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/takes')
      const newTakes = await response.json()
      setTakes(newTakes)
      setPage(1)
      setHasMore(true)
    } catch (error) {
      console.error('Error refreshing takes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (takes.length === 0 && !showingHistory) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">All Caught Up!</h2>
        <p className="text-muted-foreground mb-6">
          You've seen all the takes for now. Check back later for new ones or refresh to see if there are any you missed!
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={refreshTakes} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Takes
          </Button>
          <Button onClick={toggleHistory} variant="outline">
            View Take History
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Button
          variant={showingHistory ? "outline" : "default"}
          onClick={toggleHistory}
          className="min-w-[150px]"
        >
          {showingHistory ? "Show New Takes" : "View Take History"}
        </Button>
      </div>

      {showingHistory ? (
        <div className="space-y-6">
          <TakeFeed
            initialTakes={viewedTakes}
            communitySlug={null}
          />
          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={() => setPage(prev => prev + 1)}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <TakeFeed
            initialTakes={takes}
            communitySlug={null}
            onTakeViewed={markTakeAsViewed}
          />
          {hasMore && takes.length > 0 && (
            <div className="flex justify-center gap-4">
              <Button
                onClick={loadMoreTakes}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Takes"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 