'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Loader2, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UsernameEditorProps {
  currentUsername: string | null
  onUsernameUpdated: (newUsername: string) => void
}

export default function UsernameEditor({ currentUsername, onUsernameUpdated }: UsernameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState(currentUsername || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!username.trim()) {
      toast({
        title: 'Invalid username',
        description: 'Username cannot be empty',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/users/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const updatedUser = await response.json()
      onUsernameUpdated(updatedUser.username)
      setIsEditing(false)
      toast({
        title: 'Username updated',
        description: 'Your username has been successfully updated.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update username',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span>@{currentUsername}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">@</span>
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        className="h-8"
        disabled={isLoading}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => {
          setUsername(currentUsername || '')
          setIsEditing(false)
        }}
        disabled={isLoading}
      >
        <X className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
} 