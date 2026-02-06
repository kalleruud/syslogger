# Feature: Tag Extraction

## Overview

Automatically extract tags from log message text. Tags are text within square brackets that provide categorization for filtering. Examples: `[ERROR]`, `[DB]`, `[REQUEST]`.

## Architecture Decision

- Regex extraction of all `[CONTENT]` patterns from message
- Normalize tags: lowercase, trim whitespace
- Store tags in separate table with many-to-many relationship
- Deduplicate tags across all logs
- Exclude severity keywords that are already captured in severity field

## Dependencies

- **Features**: 02-database/02-tags-table-schema, 02-database/03-logs-tags-junction
- **Packages**: None

## Key Files

- `backend/src/syslog/tags.ts` - Tag extraction logic
- `backend/src/db/operations.ts` - Tag storage operations

## Implementation Notes

- Pattern: `/\[([^\]]+)\]/g` to match all bracketed content
- Normalize: `tag.toLowerCase().trim()`
- Skip empty tags and pure numeric tags
- Consider excluding common non-informative tags
- Maximum tag length: 50 characters (truncate longer)
- Handle Unicode in tag names

## Verification

1. Extract multiple tags from single message
2. Verify normalization (lowercase, trimmed)
3. Confirm deduplication across logs
4. Test edge cases: nested brackets, empty brackets, special characters
