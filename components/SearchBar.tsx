'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, MessageSquare, Layers, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { Dialog } from '@/components/ui/dialog'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { UserAvatar } from './ui/user-avatar'

interface SearchResult {
  users: Array<{
    id: string
    name: string
    username: string
    image: string | null
  }>
  kultures: Array<{
    id: string
    name: string
    slug: string
    _count: {
      members: number
    }
  }>
  takes: Array<{
    id: string
    title: string
    author: {
      name: string
    }
    community: {
      name: string
    }
  }>
}

export function SearchBar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = React.useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (debouncedQuery.length === 0) {
      setResults(null)
      return
    }

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Failed to fetch search results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = React.useCallback((path: string) => {
    setIsOpen(false)
    router.push(path)
  }, [router])

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setQuery('')
    }
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-full"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-1.5 rounded-full bg-muted dark:bg-black dark:border dark:border-border focus:outline-none focus:ring-2 focus:ring-purple-900 dark:focus:ring-purple-400 focus:bg-background dark:focus:bg-black"
            placeholder="Search Kulture (⌘ K)"
            onClick={() => setIsOpen(true)}
            readOnly
          />
        </div>
      </button>
      <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput
            placeholder="Search users, kultures, and takes..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : query.length > 0 && !results ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <>
                {results?.users && results.users.length > 0 ? (
                  <CommandGroup heading="Users">
                    {results.users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name}
                        onSelect={() => handleSelect(`/user/${user.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user} className="h-6 w-6" />
                          <span>{user.name}</span>
                          {user.username && (
                            <span className="text-sm text-muted-foreground">@{user.username}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {results?.kultures && results.kultures.length > 0 ? (
                  <CommandGroup heading="Kultures">
                    {results.kultures.map((kulture) => (
                      <CommandItem
                        key={kulture.id}
                        value={kulture.name}
                        onSelect={() => handleSelect(`/k/${kulture.slug}`)}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        <span>{kulture.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {kulture._count.members} members
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {results?.takes && results.takes.length > 0 ? (
                  <CommandGroup heading="Takes">
                    {results.takes.map((take) => (
                      <CommandItem
                        key={take.id}
                        value={take.title}
                        onSelect={() => handleSelect(`/take/${take.id}`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>{take.title}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          by {take.author.name} in {take.community.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {query.length > 0 && (
                  <CommandGroup heading="Actions">
                    <CommandItem
                      onSelect={() => handleSelect(`/search?q=${encodeURIComponent(query)}`)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>View all results for "{query}"</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
} 