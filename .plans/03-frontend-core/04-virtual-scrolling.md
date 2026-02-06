# Feature: Virtual Scrolling

## Overview
Efficient rendering of large log datasets using virtualization. Only visible rows are rendered in the DOM, enabling smooth scrolling through 100k+ entries.

## Architecture Decision
- Use @tanstack/react-virtual for virtualization
- Fixed row height for optimal performance
- Overscan a few rows for smooth scrolling
- Integrate with TanStack Table

## Dependencies
- **Features**: 03-terminal-log-table
- **Packages**: @tanstack/react-virtual

## Key Files
- `frontend/src/components/LogTable.tsx` - Integration point
- `frontend/src/hooks/useVirtualizedRows.ts` - Virtualization hook

## Implementation Notes
```tsx
const virtualizer = useVirtualizer({
  count: logs.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => ROW_HEIGHT, // Fixed height, e.g., 24px
  overscan: 10
})

// Render only virtual items
{virtualizer.getVirtualItems().map(virtualRow => (
  <LogRow
    key={logs[virtualRow.index].id}
    log={logs[virtualRow.index]}
    style={{ transform: `translateY(${virtualRow.start}px)` }}
  />
))}
```

- Fixed row height critical for performance
- Absolutely position rows with transform
- Container has total height for scroll
- Measure once, not per render

## Verification
1. Load 100k+ logs without browser freeze
2. Scroll smoothly through entire dataset
3. Check DOM has only ~20-30 row elements
4. Memory usage stays constant
