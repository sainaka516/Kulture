import { User } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  user: Pick<User, 'image' | 'name'> | null
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {user?.image ? (
        <AvatarImage alt="Picture" src={user.image} />
      ) : (
        <AvatarFallback>
          {user?.name ? user.name.charAt(0) : '?'}
        </AvatarFallback>
      )}
    </Avatar>
  )
} 