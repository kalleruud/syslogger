# Feature: Client-side Filtering

## Overview

Apply active filters to incoming WebSocket messages. Real-time logs only appear if they match current filter criteria.

## Architecture Decision

- Filter check before adding to display
- Same filter logic as API queries
- Don't discard filtered logs (store separately)
- Update count of filtered-out logs

## Dependencies

- **Features**: 01-websocket-client, 04-frontend-filters/\*
- **Packages**: React

## Key Files

- `frontend/src/hooks/useFilteredLogs.ts` - Filter application
- `frontend/src/utils/matchesFilters.ts` - Filter matching

## Implementation Notes

```typescript
const matchesFilters = (log: Log, filters: Filters): boolean => {
  // Severity filter
  if (filters.severity.length > 0 && !filters.severity.includes(log.severity)) {
    return false
  }

  // Search filter
  if (filters.search) {
    const search = filters.search.toLowerCase()
    if (
      !log.message.toLowerCase().includes(search) &&
      !log.appname?.toLowerCase().includes(search) &&
      !log.hostname?.toLowerCase().includes(search)
    ) {
      return false
    }
  }

  // Tag filter (AND logic)
  if (filters.tags.length > 0) {
    if (!filters.tags.every(tag => log.tags?.includes(tag))) {
      return false
    }
  }

  return true
}
```

- Apply on WebSocket message receipt
- Show indicator if logs are being filtered
- Option to show all logs temporarily

## Verification

1. Set severity filter, verify only matching logs appear
2. Set search filter, verify text matching
3. Unfiltered logs not lost (available when filter cleared)
4. Filter indicator shows when active
