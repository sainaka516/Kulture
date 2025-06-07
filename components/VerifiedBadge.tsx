import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <CheckCircle2 
      className={cn(
        "h-4 w-4 text-blue-500",
        className
      )} 
    />
  )
} 