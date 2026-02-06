# Feature: Search Input

## Overview

Full-text search input for filtering logs by message content, application name, or hostname. Debounced to prevent excessive API calls while typing.

## Architecture Decision

- Single text input in control bar
- Search across multiple fields (message, appname, hostname)
- 300ms debounce before triggering search
- Clear button when search has value
- Search icon for visual clarity

## Dependencies

- **Features**: 06-url-parameter-sync
- **Packages**: React, shadcn/ui (Input)

## Key Files

- `frontend/src/components/SearchInput.tsx` - Component
- `frontend/src/hooks/useDebounce.ts` - Debounce hook
- `frontend/src/hooks/useFilters.ts` - Filter state

## Implementation Notes

```tsx
const [inputValue, setInputValue] = useState('')
const debouncedValue = useDebounce(inputValue, 300)

useEffect(() => {
  updateFilters({ search: debouncedValue })
}, [debouncedValue])

<div className="relative">
  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2" />
  <Input
    value={inputValue}
    onChange={e => setInputValue(e.target.value)}
    placeholder="Search logs..."
    className="pl-8 pr-8"
  />
  {inputValue && <ClearButton onClick={() => setInputValue('')} />}
</div>
```

- Placeholder: "Search logs..."
- Minimum width for usability
- Escape key clears search
- Focus with keyboard shortcut (Ctrl+K or /)

## Verification

1. Type search term and verify filtered results
2. Verify 300ms delay before API call
3. Clear button resets search
4. Search persists in URL
