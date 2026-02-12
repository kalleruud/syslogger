import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const PATTERNS = {
  small: ['⠟', '⠯', '⠷', '⠾', '⠽', '⠻'].toReversed(),
  large: ['⡿', '⣟', '⣯', '⣷', '⣾', '⣽', '⣻', '⢿'].toReversed(),
} as const

type BrailleLoaderProps = {
  size?: 'small' | 'large'
} & ComponentProps<'span'>

export default function BrailleLoader({
  size = 'large',
  className,
  ...props
}: Readonly<BrailleLoaderProps>) {
  const [patternIndex, setPatternIndex] = useState(0)
  const patterns = PATTERNS[size]

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPatternIndex(index => (index + 1) % patterns.length)
    }, 100)

    return () => clearInterval(intervalId)
  }, [patterns.length])

  return (
    <span
      className={twMerge(
        'inline-block',
        'text-primary shadow-primary text-shadow-[0_0px_10px]',
        className
      )}
      {...props}>
      {patterns[patternIndex]}
    </span>
  )
}
