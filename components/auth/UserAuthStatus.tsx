'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function UserAuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Avatar className="cursor-wait">
        <AvatarFallback className="bg-gray-100">
          <User className="h-5 w-5 text-gray-400" />
        </AvatarFallback>
      </Avatar>
    )
  }

  if (status === 'authenticated' && session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>{session.user.name?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <ThemeToggle />
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => signOut({
              callbackUrl: `${window.location.origin}/sign-in`
            })}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Link href="/sign-in">
      <Avatar className="cursor-pointer hover:opacity-80">
        <AvatarFallback className="bg-gray-100">
          <User className="h-5 w-5 text-gray-400" />
        </AvatarFallback>
      </Avatar>
    </Link>
  )
} 