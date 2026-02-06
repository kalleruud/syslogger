# Feature: Top Control Bar

## Overview
Fixed bar at the top containing all controls: search input, filter dropdowns, column visibility toggle, and settings button. Single row, always visible.

## Architecture Decision
- Fixed position at top of viewport
- Horizontal layout with flexbox
- Controls grouped logically: search left, filters center, settings right
- Responsive: stack on very narrow screens

## Dependencies
- **Features**: 04-frontend-filters/* (filter components)
- **Packages**: React, Tailwind CSS, shadcn/ui

## Key Files
- `frontend/src/components/ControlBar.tsx` - Main component
- `frontend/src/components/controls/` - Individual controls

## Implementation Notes
```tsx
<div className="flex items-center gap-2 p-2 bg-gray-900 border-b border-gray-700">
  <SearchInput />
  <SeverityFilter />
  <ApplicationFilter />
  <TagFilter />
  <HostnameFilter />
  <div className="flex-1" /> {/* Spacer */}
  <ColumnToggle />
  <SettingsButton />
</div>
```

- Compact design to maximize log viewing area
- Dropdowns open downward
- Visual separation between control groups
- Keyboard navigation between controls

## Verification
1. All controls visible and accessible
2. Dropdowns function correctly
3. Bar stays fixed during scroll
4. Responsive layout works
