# Feature: Browser History Support

## Overview

Proper integration with browser back/forward navigation. Filter changes create history entries that can be navigated.

## Architecture Decision

- Use pushState for significant filter changes
- Use replaceState for minor updates (typing)
- Listen to popstate events
- Restore filter state from URL on navigation

## Dependencies

- **Features**: 06-url-parameter-sync
- **Packages**: React

## Key Files

- `frontend/src/hooks/useFilters.ts` - Filter state
- `frontend/src/hooks/useURLSync.ts` - URL handling

## Implementation Notes

```tsx
// Push state for significant changes (e.g., dropdown selection)
window.history.pushState({}, '', newURL)

// Replace state for minor changes (e.g., typing search)
window.history.replaceState({}, '', newURL)

// Listen for back/forward navigation
useEffect(() => {
  const handlePopState = () => {
    const newFilters = parseURLParams()
    setFilters(newFilters)
  }
  window.addEventListener('popstate', handlePopState)
  return () => window.removeEventListener('popstate', handlePopState)
}, [])
```

- Debounce search to single history entry
- Dropdown changes create new entry
- Clear all filters = new entry
- Don't create entry if filters unchanged

## Verification

1. Change filter, click back, verify previous state restored
2. Forward navigation works after back
3. Search typing creates single history entry
4. Filter dropdown creates new entry
