# Feature: Tag Badges

## Overview

Display tags associated with the selected log as visual badges in the detail panel. Tags are clickable to filter by that tag.

## Architecture Decision

- Tags shown as inline badges
- Badge styling matches terminal theme
- Click tag to add to filter
- Show "No tags" when empty

## Dependencies

- **Features**: 02-non-blocking-panel, 04-frontend-filters/04-tag-multiselect
- **Packages**: shadcn/ui (Badge)

## Key Files

- `frontend/src/components/DetailPanel.tsx` - Badge rendering
- `frontend/src/components/TagBadge.tsx` - Badge component

## Implementation Notes

```tsx
// Tags section in detail panel
<div className='flex flex-wrap gap-1'>
  <span className='text-gray-500'>Tags:</span>
  {log.tags?.length > 0 ? (
    log.tags.map(tag => (
      <Badge
        key={tag}
        variant='outline'
        className='cursor-pointer hover:bg-gray-700'
        onClick={() => addTagFilter(tag)}>
        {tag}
      </Badge>
    ))
  ) : (
    <span className='text-gray-600'>None</span>
  )}
</div>
```

- Small badge size to not overwhelm
- Hover effect indicates clickability
- Tooltip: "Click to filter by this tag"
- Badge color neutral (not severity-based)

## Verification

1. Tags displayed as badges
2. Click badge adds to tag filter
3. Empty tags shows "None"
4. Multiple tags wrap correctly
