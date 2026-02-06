# Feature: Settings Popup

## Overview

Modal dialog for configuring application settings, accessed via the settings button in the control bar. Primary use is retention configuration.

## Architecture Decision

- Modal dialog (blocks background)
- Settings button with gear icon
- Tab or section organization if multiple settings
- Save and Cancel buttons

## Dependencies

- **Features**: 03-frontend-core/02-top-control-bar
- **Packages**: shadcn/ui (Dialog)

## Key Files

- `frontend/src/components/SettingsPopup.tsx` - Dialog component
- `frontend/src/components/SettingsButton.tsx` - Trigger button

## Implementation Notes

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant='ghost' size='icon'>
      <SettingsIcon className='h-4 w-4' />
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>
    <RetentionSettings />
    <DialogFooter>
      <Button variant='outline' onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- Escape key closes dialog
- Click outside closes (with confirmation if changes)
- Loading state during save
- Success/error toast after save

## Verification

1. Settings button opens popup
2. Dialog displays correctly
3. Save persists changes
4. Cancel discards changes
