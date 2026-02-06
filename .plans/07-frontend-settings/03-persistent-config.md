# Feature: Persistent Config

## Overview

Settings persist across browser sessions via the backend API. Settings are stored in `config.json` on the server and survive server restarts.

## Architecture Decision

- Fetch settings from API on load
- Save settings to API on change
- Settings shared across all clients
- Local optimistic updates with rollback

## Dependencies

- **Features**: 01-backend/11-api-settings-endpoints
- **Packages**: React Query (optional)

## Key Files

- `frontend/src/hooks/useSettings.ts` - Settings hook
- `frontend/src/api/settings.ts` - API calls

## Implementation Notes

```tsx
const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [])

  // Save function
  const saveSettings = async (newSettings: Settings) => {
    const oldSettings = settings
    setSettings(newSettings) // Optimistic update

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
    } catch (error) {
      setSettings(oldSettings) // Rollback
      throw error
    }
  }

  return { settings, loading, saveSettings }
}
```

- Show loading state initially
- Handle save errors gracefully
- Consider refetch on window focus

## Verification

1. Settings load on page load
2. Save persists to server
3. Refresh shows saved settings
4. Multiple tabs share settings
