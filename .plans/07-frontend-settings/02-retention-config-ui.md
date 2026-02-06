# Feature: Retention Config UI

## Overview
UI for configuring log retention periods per severity level. Each severity can have a different retention period or be kept indefinitely.

## Architecture Decision
- List of all 8 severity levels
- Number input for days (or null for forever)
- Checkbox for "Keep forever" option
- Color-coded to match severity colors

## Dependencies
- **Features**: 01-settings-popup, 01-backend/11-api-settings-endpoints
- **Packages**: shadcn/ui (Input, Checkbox)

## Key Files
- `frontend/src/components/RetentionSettings.tsx` - Settings form
- `frontend/src/hooks/useSettings.ts` - Settings state

## Implementation Notes
```tsx
const SEVERITIES = [
  { level: 0, name: 'Emergency', color: 'text-red-500' },
  { level: 1, name: 'Alert', color: 'text-red-400' },
  // ... etc
]

{SEVERITIES.map(sev => (
  <div key={sev.level} className="flex items-center gap-4">
    <span className={cn('w-24', sev.color)}>{sev.name}</span>
    <Input
      type="number"
      min={1}
      disabled={retention[sev.level] === null}
      value={retention[sev.level] ?? ''}
      onChange={e => setRetention(sev.level, parseInt(e.target.value))}
    />
    <span className="text-gray-500">days</span>
    <Checkbox
      checked={retention[sev.level] === null}
      onCheckedChange={checked =>
        setRetention(sev.level, checked ? null : 30)
      }
    />
    <span>Keep forever</span>
  </div>
))}
```

- Validate: positive integers only
- Show current settings on load
- Preview of what will be deleted (optional)

## Verification
1. All severity levels displayed
2. Number input updates value
3. "Keep forever" checkbox works
4. Settings saved via API
