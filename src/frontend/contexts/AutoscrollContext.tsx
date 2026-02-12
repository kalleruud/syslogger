import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface AutoscrollContextType {
  isAutoscrollEnabled: boolean
  setIsAutoscrollEnabled: (enabled: boolean) => void
}

const AutoscrollContext = createContext<AutoscrollContextType | undefined>(
  undefined
)

export function AutoscrollProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isAutoscrollEnabled, setIsAutoscrollEnabled] = useState(true)

  return (
    <AutoscrollContext.Provider
      value={useMemo(
        () => ({ isAutoscrollEnabled, setIsAutoscrollEnabled }),
        [isAutoscrollEnabled, setIsAutoscrollEnabled]
      )}>
      {children}
    </AutoscrollContext.Provider>
  )
}

export const useAutoscroll = () => {
  const context = useContext(AutoscrollContext)
  if (!context)
    throw new Error('useAutoscroll must be used inside AutoscrollProvider')
  return context
}
