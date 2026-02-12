import { Radio, WifiOff } from 'lucide-react'
import { useConnection } from '../contexts/ConnectionContext'

export default function AutoscrollBadge() {
  const { isConnected } = useConnection()
  return (
    <div>
      {isConnected ? (
        <Radio className={'size-8 animate-pulse text-primary'} />
      ) : (
        <WifiOff className={'size-8 text-destructive'} />
      )}
    </div>
  )
}
