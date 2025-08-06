'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Take, Vote } from '@/lib/types'

interface TakesContextType {
  takes: Take[]
  updateTake: (updatedTake: Take) => void
  setTakes: React.Dispatch<React.SetStateAction<Take[]>>
  getCurrentTake: (takeId: string) => Take | undefined
}

export const TakesContext = createContext<TakesContextType | undefined>(undefined)

interface TakesProviderProps {
  children: React.ReactNode
  initialTakes: Take[]
}

export function TakesProvider({ children, initialTakes }: TakesProviderProps) {
  const [takes, setTakes] = useState<Take[]>(initialTakes)
  
  console.log('TakesProvider: Initialized with', initialTakes.length, 'takes')

  const getCurrentTake = (takeId: string) => {
    return takes.find(take => take.id === takeId)
  }

  // Listen for vote updates from other tabs/windows
  useEffect(() => {
    const broadcastChannel = new BroadcastChannel('vote-updates')
    
    const handleVoteUpdate = (event: MessageEvent) => {
      const { takeId, updatedTake } = event.data
      
      setTakes(prev =>
        prev.map(take =>
          take.id === takeId ? {
            ...take,
            ...updatedTake,
            votes: updatedTake.votes,
            userVote: updatedTake.userVote,
            _count: {
              ...take._count,
              ...updatedTake._count,
              upvotes: updatedTake.votes.filter((v: Vote) => v.type === 'UP').length,
              downvotes: updatedTake.votes.filter((v: Vote) => v.type === 'DOWN').length,
            }
          } : take
        )
      )
    }

    broadcastChannel.addEventListener('message', handleVoteUpdate)
    
    return () => {
      broadcastChannel.removeEventListener('message', handleVoteUpdate)
      broadcastChannel.close()
    }
  }, [])

  // Update takes when initialTakes changes
  useEffect(() => {
    setTakes(prev => {
      // Preserve existing vote data when updating takes
      return initialTakes.map(newTake => {
        const existingTake = prev.find(t => t.id === newTake.id)
        if (existingTake) {
          return {
            ...newTake,
            votes: existingTake.votes,
            userVote: existingTake.userVote,
            _count: {
              ...newTake._count,
              upvotes: existingTake.votes.filter((v: Vote) => v.type === 'UP').length,
              downvotes: existingTake.votes.filter((v: Vote) => v.type === 'DOWN').length,
            }
          }
        }
        return newTake
      })
    })
  }, [initialTakes])

  const updateTake = (updatedTake: Take) => {
    console.log('TakesContext: Updating take:', updatedTake)
    setTakes(prev => {
      const newTakes = prev.map(take =>
        take.id === updatedTake.id ? {
          ...take,
          ...updatedTake,
          votes: updatedTake.votes || take.votes,
          userVote: updatedTake.userVote,
          _count: {
            ...take._count,
            ...updatedTake._count,
            upvotes: (updatedTake.votes || take.votes).filter((v: Vote) => v.type === 'UP').length,
            downvotes: (updatedTake.votes || take.votes).filter((v: Vote) => v.type === 'DOWN').length,
          }
        } : take
      )
      console.log('TakesContext: New takes state:', newTakes)
      return newTakes
    })

    // Broadcast the update to other tabs/windows
    const broadcastChannel = new BroadcastChannel('vote-updates')
    broadcastChannel.postMessage({
      takeId: updatedTake.id,
      updatedTake
    })
    broadcastChannel.close()
  }

  const value = {
    takes,
    updateTake,
    setTakes,
    getCurrentTake
  }

  return (
    <TakesContext.Provider value={value}>
      {children}
    </TakesContext.Provider>
  )
}

export function useTakes() {
  const context = useContext(TakesContext)
  if (context === undefined) {
    throw new Error('useTakes must be used within a TakesProvider')
  }
  return context
} 