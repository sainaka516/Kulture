'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { forceSignOut, clearAllStorage, getSessionInfo, isNewDevice } from '@/lib/session-utils'
import { RefreshCw, Trash2, UserX } from 'lucide-react'

export default function DevSessionHelper() {
  const { data: session, status } = useSession()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isNewDeviceState, setIsNewDeviceState] = useState<boolean>(false)

  const handleGetSessionInfo = () => {
    setSessionInfo(getSessionInfo())
    setIsNewDeviceState(isNewDevice())
  }

  const handleClearAll = async () => {
    clearAllStorage()
    await forceSignOut()
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          🔧 Dev Session Helper
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Session Info */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>User:</span>
            <span className="font-mono">{session?.user?.name || 'Not logged in'}</span>
          </div>
          <div className="flex justify-between">
            <span>Email:</span>
            <span className="font-mono text-muted-foreground">{session?.user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>New Device:</span>
            <Badge variant={isNewDeviceState ? "destructive" : "secondary"} className="text-xs">
              {isNewDeviceState ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetSessionInfo}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Info
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearAll}
            className="flex-1"
          >
            <UserX className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>

        {/* Session Info Display */}
        {sessionInfo && (
          <details className="text-xs">
            <summary className="cursor-pointer hover:text-foreground">Session Details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  )
} 