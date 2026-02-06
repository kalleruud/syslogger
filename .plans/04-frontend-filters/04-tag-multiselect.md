# Feature: Tag Multi-select

## Overview

Dropdown filter for selecting tags extracted from log messages. Options loaded from the tags API endpoint.

## Architecture Decision

- Multi-select dropdown with checkboxes
- Fetch tags from `/api/tags` endpoint
- Filter shows logs that have ALL selected tags
- Badge-style tag display in dropdown

## Dependencies

- **Features**: 06-url-parameter-sync, 01-backend/10-api-tags-endpoint
- **Packages**: shadcn/ui (Popover, Command)

## Key Files

- `frontend/src/components/TagFilter.tsx` - Component
- `frontend/src/hooks/useTags.ts` - Data fetching
- `frontend/src/hooks/useFilters.ts` - Filter state

## Implementation Notes

```tsx
const { data: tags } = useQuery({
  queryKey: ['tags'],
  queryFn: () => fetch('/api/tags').then(r => r.json())
})

// Tags displayed as badges
<Badge variant="outline">{tag}</Badge>
```

- Tags shown as small badges in dropdown
- AND logic: log must have all selected tags
- Refresh tags periodically (new tags from incoming logs)
- Search/filter within dropdown

## Verification

1. Tags from API appear in dropdown
2. Selecting tags filters logs correctly
3. Multiple tags use AND logic
4. Filter persists in URL
