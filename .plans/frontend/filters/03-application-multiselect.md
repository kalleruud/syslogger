# Feature: Application Multi-select

## Overview

Dropdown filter for selecting application names (appname field). Options are dynamically loaded from existing log data.

## Architecture Decision

- Multi-select dropdown with checkboxes
- Fetch unique appnames from API
- Empty selection means no filter (show all)
- Searchable dropdown for long lists

## Dependencies

- **Features**: 06-url-parameter-sync, 01-backend/09-api-logs-endpoint
- **Packages**: shadcn/ui (Popover, Command)

## Key Files

- `frontend/src/components/ApplicationFilter.tsx` - Component
- `frontend/src/hooks/useApplications.ts` - Data fetching
- `frontend/src/hooks/useFilters.ts` - Filter state

## Implementation Notes

```tsx
// Fetch unique applications from logs
const { data: applications } = useQuery({
  queryKey: ['applications'],
  queryFn: () => fetch('/api/logs/applications').then(r => r.json()),
})

// Or derive from distinct appnames in existing logs API
```

- Button shows "Applications" or count when filtered
- Search input for filtering long lists
- Load apps on first dropdown open
- Consider caching with stale-while-revalidate

## Verification

1. Dropdown shows all unique applications
2. Select apps and verify filter works
3. Search within dropdown works
4. Filter persists in URL
