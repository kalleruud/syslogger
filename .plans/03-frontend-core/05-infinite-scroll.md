# Feature: Infinite Scroll

## Overview
Automatically load older logs when user scrolls toward the top of the log table. Provides seamless browsing of historical data without manual pagination.

## Architecture Decision
- Trigger load when scroll position near top
- Use Intersection Observer for efficiency
- Prepend new logs while maintaining scroll position
- Debounce API calls to prevent flooding

## Dependencies
- **Features**: 04-virtual-scrolling, 01-backend/09-api-logs-endpoint
- **Packages**: React

## Key Files
- `frontend/src/hooks/useInfiniteScroll.ts` - Scroll detection
- `frontend/src/hooks/useLogs.ts` - Data fetching integration

## Implementation Notes
```tsx
// Intersection Observer for scroll detection
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && hasMore && !loading) {
    loadMore()
  }
}, { threshold: 0.1 })

// Track scroll position before prepend
const scrollHeight = container.scrollHeight
// After prepend, adjust scroll position
container.scrollTop += container.scrollHeight - scrollHeight
```

- Sentinel element at top of list
- Track `hasMore` flag from API response
- Maintain scroll position after data prepend
- Show loading indicator during fetch

## Verification
1. Scroll to top triggers load
2. Scroll position maintained after load
3. No duplicate requests
4. Loading indicator visible during fetch
