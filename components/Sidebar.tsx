'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Home,
  Compass,
  Bell,
  MessageSquare,
  User,
  PlusCircle,
  Settings,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navigation = [
    { name: 'Home', href: session?.user ? '/profile' : '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const secondaryNavigation = [
    { name: 'Share Take', href: '/submit', icon: PlusCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="fixed top-14 bottom-0 left-0 w-64 bg-card dark:bg-black border-r border-border">
      <nav className="p-4 space-y-8">
        <div className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                (pathname === item.href || (item.href === '/profile' && pathname === '/'))
                  ? 'bg-purple-900/10 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'text-muted-foreground hover:bg-purple-900/10 hover:text-purple-900 dark:hover:bg-purple-900/20 dark:hover:text-purple-400'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
        <div className="space-y-2">
          {secondaryNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-purple-900/10 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'text-muted-foreground hover:bg-purple-900/10 hover:text-purple-900 dark:hover:bg-purple-900/20 dark:hover:text-purple-400'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
} 