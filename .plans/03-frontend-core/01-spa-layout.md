# Feature: SPA Layout

## Overview
Single-page application layout with a minimal, terminal-inspired design. The entire UI fits on one page with a fixed top bar and scrollable log table.

## Architecture Decision
- Full viewport height layout with flexbox
- Fixed top control bar
- Flexible-height log table area
- Optional detail panel between bar and table
- Dark terminal aesthetic with monospace fonts

## Dependencies
- **Features**: None (base layout)
- **Packages**: React, Tailwind CSS

## Key Files
- `frontend/src/App.tsx` - Root component with layout
- `frontend/src/layouts/MainLayout.tsx` - Layout wrapper
- `frontend/src/index.css` - Global styles

## Implementation Notes
```tsx
// Layout structure
<div className="h-screen flex flex-col bg-black text-green-400 font-mono">
  <ControlBar />
  {selectedLog && <DetailPanel />}
  <LogTable className="flex-1 overflow-hidden" />
</div>
```

- Use CSS variables for terminal colors
- Monospace font (e.g., JetBrains Mono, Fira Code)
- No margins between components
- Scrollbars styled to match terminal theme

## Verification
1. App fills entire viewport
2. Layout stable at different screen sizes
3. Terminal aesthetic visible
4. Components properly positioned
