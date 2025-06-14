import { User } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface UserAvatarProps {
  user: Pick<User, 'image' | 'username' | 'name'> | null
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={user?.image || undefined} alt={user?.name || user?.username || "User"} />
      <AvatarFallback>
        {user?.name
          ? user.name.charAt(0).toUpperCase()
          : user?.username
          ? user.username.charAt(0).toUpperCase()
          : "?"}
      </AvatarFallback>
    </Avatar>
  )
} 