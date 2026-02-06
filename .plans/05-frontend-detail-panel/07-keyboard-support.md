# Feature: Keyboard Support

## Overview
Keyboard navigation for the detail panel. Escape to close, arrow keys to navigate between logs.

## Architecture Decision
- Escape key closes detail panel
- Up/Down arrows navigate to prev/next log
- Tab for focus within panel
- Global key handlers when panel open

## Dependencies
- **Features**: 01-click-to-inspect
- **Packages**: React

## Key Files
- `frontend/src/components/DetailPanel.tsx` - Key handlers
- `frontend/src/hooks/useKeyboardNavigation.ts` - Navigation hook

## Implementation Notes
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePanel()
    } else if (e.key === 'ArrowUp') {
      selectPreviousLog()
    } else if (e.key === 'ArrowDown') {
      selectNextLog()
    }
  }

  if (selectedLog) {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }
}, [selectedLog])
```

- Only active when panel is open
- Don't interfere with input focus
- Arrow navigation respects current filters
- Consider j/k vim-style navigation

## Verification
1. Escape closes panel
2. Up/Down arrows navigate logs
3. Navigation stays within visible logs
4. Keys don't interfere with search input
