'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, PlusCircle } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import UserAuthStatus from '@/components/auth/UserAuthStatus'
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

export default function Navbar() {
  const pathname = usePathname()
  const { status, session } = useSession()

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
            href={session?.user ? '/profile' : '/'}
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              (pathname === "/" || pathname === "/profile") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/subkultures"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === "/subkultures" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Subkultures
          </Link>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search Kulture"
              className="w-full pl-10 pr-4 py-1.5 rounded-full bg-muted dark:bg-black dark:border dark:border-border focus:outline-none focus:ring-2 focus:ring-purple-900 dark:focus:ring-purple-400 focus:bg-background dark:focus:bg-black"
            />
          </div>
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
                  user={{ name: session.user.name || null, image: session.user.image || null }}
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
                  <Link href="/create-subkulture">
                    Create a Subkulture
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
                  Sign out
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