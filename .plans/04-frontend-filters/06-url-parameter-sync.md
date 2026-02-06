# Feature: URL Parameter Sync

## Overview
Synchronize all filter state with URL query parameters. Enables bookmarking and sharing of filtered views.

## Architecture Decision
- Store filter state in URL search params
- Parse params on initial load
- Update URL when filters change
- Use replace (not push) for filter changes

## Dependencies
- **Features**: All filter components (01-05)
- **Packages**: React Router or native URL API

## Key Files
- `frontend/src/hooks/useFilters.ts` - Filter state management
- `frontend/src/hooks/useURLSync.ts` - URL synchronization

## Implementation Notes
```tsx
// URL format: ?search=error&severity=3,4&tags=db,timeout

// Parse URL on load
const params = new URLSearchParams(window.location.search)
const initialFilters = {
  search: params.get('search') ?? '',
  severity: params.get('severity')?.split(',').map(Number) ?? [],
  tags: params.get('tags')?.split(',') ?? [],
  hostname: params.get('hostname') ?? ''
}

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.severity.length) params.set('severity', filters.severity.join(','))
  // ...
  window.history.replaceState({}, '', `?${params}`)
}, [filters])
```

- Empty values omit the parameter
- Array values joined with commas
- Debounce URL updates to avoid rapid changes

## Verification
1. Set filters and verify URL updates
2. Load URL with params and verify filters applied
3. Share URL and verify same view
4. Bookmark works correctly
