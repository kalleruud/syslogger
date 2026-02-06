# Feature: Retention Cleanup Job

## Overview
Scheduled job that removes old log entries based on per-severity retention settings. Runs daily to prevent unbounded database growth.

## Architecture Decision
- Run cleanup once per day
- Check each severity level against its retention setting
- Delete logs older than retention period
- Vacuum database periodically to reclaim space
- Read settings from config.json (live updates)

## Dependencies
- **Features**: 11-api-settings-endpoints (provides retention settings)
- **Packages**: None

## Key Files
- `backend/src/jobs/retention.ts` - Cleanup job logic
- `backend/src/db/cleanup.ts` - Deletion queries
- `backend/src/index.ts` - Job scheduling

## Implementation Notes
- Schedule: run at startup, then every 24 hours
- For each severity 0-7, check retention setting
- `null` = keep forever, skip this severity
- Delete: `WHERE severity = ? AND timestamp < ?`
- Calculate cutoff: `Date.now() - (retentionDays * 86400000)`
- Batch deletes to avoid long locks
- Log deleted count per severity

## Verification
1. Set short retention (1 day) for a severity
2. Create logs with that severity
3. Run cleanup job
4. Verify old logs deleted, new logs retained
