'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <div className="flex items-center">
        {theme === 'dark' ? (
          <>
            <Sun className="h-4 w-4 mr-2" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 mr-2" />
            <span>Dark Mode</span>
          </>
        )}
      </div>
    </DropdownMenuItem>
  )
} 