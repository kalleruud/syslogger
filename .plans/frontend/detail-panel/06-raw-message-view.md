# Feature: Raw Message View

## Overview

Display the original, unparsed syslog message in the detail panel. Useful for debugging parsing issues or seeing the exact message received.

## Architecture Decision

- Collapsible section for raw message
- Monospace font in code block style
- Copy button for raw content
- Scroll for long messages

## Dependencies

- **Features**: 02-non-blocking-panel, 02-database/07-raw-message-storage
- **Packages**: React

## Key Files

- `frontend/src/components/DetailPanel.tsx` - Raw section
- `frontend/src/components/RawMessageView.tsx` - Display component

## Implementation Notes

```tsx
<Collapsible>
  <CollapsibleTrigger className='flex items-center gap-2'>
    <ChevronRight className='h-4 w-4' />
    <span>Raw Message</span>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className='relative'>
      <pre className='overflow-x-auto rounded bg-gray-950 p-2 text-xs'>
        {log.raw}
      </pre>
      <CopyButton value={log.raw} className='absolute top-1 right-1' />
    </div>
  </CollapsibleContent>
</Collapsible>
```

- Collapsed by default to save space
- Preserve whitespace and formatting
- Horizontal scroll for long lines
- Copy entire raw message

## Verification

1. Raw message section is collapsible
2. Content matches original message
3. Copy button works
4. Special characters displayed correctly
