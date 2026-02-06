# Feature: Hostname Filter

## Overview

Filter logs by exact hostname match. Simple dropdown or text input for selecting/entering hostname to filter by.

## Architecture Decision

- Dropdown with unique hostnames from data
- OR simple text input with autocomplete
- Single selection (not multi-select)
- Exact match filtering

## Dependencies

- **Features**: 06-url-parameter-sync
- **Packages**: shadcn/ui (Select or Combobox)

## Key Files

- `frontend/src/components/HostnameFilter.tsx` - Component
- `frontend/src/hooks/useHostnames.ts` - Data fetching
- `frontend/src/hooks/useFilters.ts` - Filter state

## Implementation Notes

```tsx
// Fetch unique hostnames
const { data: hostnames } = useQuery({
  queryKey: ['hostnames'],
  queryFn: () => fetch('/api/logs/hostnames').then(r => r.json())
})

// Combobox for searchable selection
<Combobox
  value={selectedHostname}
  onChange={setSelectedHostname}
  options={hostnames}
  placeholder="All hosts"
/>
```

- "All hosts" option for no filtering
- Searchable for environments with many hosts
- Display currently selected hostname
- Clear button to remove filter

## Verification

1. Hostnames from data appear in dropdown
2. Selecting hostname filters correctly
3. Filter shows exact matches only
4. Filter persists in URL
