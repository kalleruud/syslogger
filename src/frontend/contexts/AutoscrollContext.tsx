import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface AutoscrollContextType {
  isAutoscrollEnabled: boolean
  setIsAutoscrollEnabled: (enabled: boolean) => void
  scrollToBottomRef: React.RefObject<(() => void) | null>
}

const AutoscrollContext = createContext<AutoscrollContextType | undefined>(
  undefined
)

export function AutoscrollProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isAutoscrollEnabled, setIsAutoscrollEnabled] = useState(true)
  const scrollToBottomRef = useRef<(() => void) | null>(null)

  return (
    <AutoscrollContext.Provider
      value={useMemo(
        () => ({
          isAutoscrollEnabled,
          setIsAutoscrollEnabled,
          scrollToBottomRef,
        }),
        [isAutoscrollEnabled]
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
