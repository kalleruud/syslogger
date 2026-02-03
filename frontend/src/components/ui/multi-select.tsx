import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(s => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const label = selected.length === 0
    ? placeholder
    : `${selected.length} selected`;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted/50"
      >
        <span className={cn(selected.length === 0 && "text-muted-foreground")}>
          {label}
        </span>
        <ChevronDown className={cn("ml-2 h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[160px] rounded-md border border-border bg-popover shadow-lg">
          <div className="max-h-60 overflow-auto py-1">
            {options.map(opt => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-input transition-colors",
                    isSelected && "border-primary bg-primary text-primary-foreground"
                  )}>
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                  {opt.label}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
