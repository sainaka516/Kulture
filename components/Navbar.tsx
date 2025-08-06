'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlusCircle, Layers, Trophy, LogOut, UserSwitch } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import UserAuthStatus from '@/components/auth/UserAuthStatus'
import { SearchBar } from '@/components/SearchBar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/lib/utils'
import { forceSignOut, clearAllStorage } from '@/lib/session-utils'

export default function Navbar() {
  const pathname = usePathname()
  const { status, data: session } = useSession()

  return (
    <div className="fixed top-0 inset-x-0 h-fit bg-background border-b border-border z-[10] py-2">
      <div className="container max-w-7xl h-full mx-auto flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <p className="hidden text-purple-900 dark:text-purple-400 text-sm font-medium md:block">
            Kulture
          </p>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4 flex-1 justify-start max-w-xs">
          <Link
            href="/explore"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === "/explore" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Explore
          </Link>
          <Link
            href="/kultures"
            className={cn(
              "flex items-center gap-2 font-medium transition-colors hover:text-foreground",
              pathname === "/kultures" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            Kultures
          </Link>
          <Link
            href="/leaderboard"
            className={cn(
              "flex items-center gap-2 font-medium transition-colors hover:text-foreground",
              pathname === "/leaderboard" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl px-4">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {status === 'authenticated' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-purple-900 dark:hover:text-purple-400"
              asChild
            >
              <Link href="/submit">
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Share Take</span>
              </Link>
            </Button>
          )}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <UserAvatar
                  user={{ 
                    name: session.user.name || null, 
                    image: session.user.image || null,
                    username: session.user.email?.split('@')[0] || 'user'
                  }}
                  className="h-8 w-8"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/create-kulture">
                    Create a Kulture
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/submit">
                    Share Take
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault()
                    signOut({
                      callbackUrl: `${window.location.origin}/sign-in`,
                    })
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={async (event) => {
                    event.preventDefault()
                    clearAllStorage()
                    await forceSignOut()
                  }}
                >
                  <UserSwitch className="mr-2 h-4 w-4" />
                  Switch Account (Clear All)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <UserAuthStatus />
          )}
        </div>
      </div>
    </div>
  )
} 