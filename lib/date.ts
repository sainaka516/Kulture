import { formatDistanceToNow } from 'date-fns'

export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
} 