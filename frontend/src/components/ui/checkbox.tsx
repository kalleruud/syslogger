import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <label className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className="peer sr-only"
        {...props}
      />
      <div
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}
      >
        <Check className="hidden h-3 w-3 peer-checked:block" />
      </div>
    </label>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
