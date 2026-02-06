# Feature: Field Display

## Overview
Display all syslog fields in the detail panel with human-readable labels. Provides complete information about the selected log entry.

## Architecture Decision
- Key-value layout for all fields
- Human-readable labels (not raw field names)
- Formatted values where appropriate
- Copy button for values

## Dependencies
- **Features**: 02-non-blocking-panel
- **Packages**: React

## Key Files
- `frontend/src/components/DetailPanel.tsx` - Field rendering
- `frontend/src/utils/formatters.ts` - Value formatters

## Implementation Notes
```tsx
const FIELD_LABELS = {
  timestamp: 'Timestamp',
  severity: 'Severity',
  facility: 'Facility',
  hostname: 'Hostname',
  appname: 'Application',
  procid: 'Process ID',
  msgid: 'Message ID',
  message: 'Message'
}

// Display with labels
<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
  {Object.entries(FIELD_LABELS).map(([key, label]) => (
    <React.Fragment key={key}>
      <span className="text-gray-500">{label}:</span>
      <span className="font-mono">{formatField(key, log[key])}</span>
    </React.Fragment>
  ))}
</div>
```

- Timestamp formatted as full date/time
- Severity shows name and number
- Null fields show "N/A" or dash
- Message field spans full width

## Verification
1. All fields displayed with correct labels
2. Values formatted appropriately
3. Null fields handled gracefully
4. Copy buttons work for long values
