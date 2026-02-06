import { and, desc, eq, inArray, like, sql } from 'drizzle-orm'
import db from './database'
import { type Log, logs, logsTags, type NewLog, type NewTag, tags } from './schema'

export interface LogFilters {
  severity?: number[]
  hostname?: string
  appname?: string
  search?: string
  tagIds?: number[]
  limit?: number
  offset?: number
}

export interface LogWithTags extends Log {
  tags: { id: number; name: string }[]
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

// Get logs with optional filters and pagination
export async function getLogs(
  filters: LogFilters = {}
): Promise<PaginatedResult<LogWithTags>> {
  const limit = filters.limit ?? 100
  const offset = filters.offset ?? 0

  const conditions = []

  if (filters.severity?.length) {
    conditions.push(inArray(logs.severity, filters.severity))
  }
  if (filters.hostname) {
    conditions.push(eq(logs.hostname, filters.hostname))
  }
  if (filters.appname) {
    conditions.push(eq(logs.appname, filters.appname))
  }
  if (filters.search) {
    conditions.push(like(logs.message, `%${filters.search}%`))
  }

  // Filter by tags if specified
  let logIdsWithTags: number[] | undefined
  if (filters.tagIds?.length) {
    const taggedLogs = await db
      .select({ logId: logsTags.logId })
      .from(logsTags)
      .where(inArray(logsTags.tagId, filters.tagIds))
      .groupBy(logsTags.logId)
    logIdsWithTags = taggedLogs.map(r => r.logId)

    if (logIdsWithTags.length === 0) {
      return { data: [], total: 0, limit, offset }
    }
    conditions.push(inArray(logs.id, logIdsWithTags))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(logs)
    .where(whereClause)
  const total = countResult[0]?.count ?? 0

  // Get paginated logs
  const logsResult = await db
    .select()
    .from(logs)
    .where(whereClause)
    .orderBy(desc(logs.timestamp))
    .limit(limit)
    .offset(offset)

  // Load tags for returned logs
  const logIds = logsResult.map(l => l.id)
  const logsWithTags = await loadTagsForLogs(logsResult, logIds)

  return { data: logsWithTags, total, limit, offset }
}

// Get a single log by ID with tags
export async function getLogById(id: number): Promise<LogWithTags | null> {
  const result = await db.select().from(logs).where(eq(logs.id, id)).limit(1)

  if (result.length === 0) return null

  const [logWithTags] = await loadTagsForLogs(result, [id])
  return logWithTags
}

// Insert a new log entry
export async function insertLog(log: NewLog): Promise<Log> {
  const result = await db.insert(logs).values(log).returning()
  return result[0]
}

// Insert a log with tags (creates tags if they don't exist)
export async function insertLogWithTags(
  log: NewLog,
  tagNames: string[]
): Promise<LogWithTags> {
  const insertedLog = await insertLog(log)

  if (tagNames.length > 0) {
    // Normalize tag names
    const normalizedTags = tagNames.map(t => t.toLowerCase().trim())

    // Insert or ignore tags
    await db
      .insert(tags)
      .values(normalizedTags.map(name => ({ name })))
      .onConflictDoNothing()

    // Get tag IDs
    const tagRecords = await db
      .select()
      .from(tags)
      .where(inArray(tags.name, normalizedTags))

    // Create log-tag associations
    await db.insert(logsTags).values(
      tagRecords.map(tag => ({
        logId: insertedLog.id,
        tagId: tag.id,
      }))
    )

    return {
      ...insertedLog,
      tags: tagRecords.map(t => ({ id: t.id, name: t.name })),
    }
  }

  return { ...insertedLog, tags: [] }
}

// Get all unique tags
export async function getAllTags(): Promise<{ id: number; name: string }[]> {
  const result = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .orderBy(tags.name)
  return result
}

// Get or create a tag by name
export async function getOrCreateTag(
  name: string
): Promise<NewTag & { id: number }> {
  const normalized = name.toLowerCase().trim()

  await db.insert(tags).values({ name: normalized }).onConflictDoNothing()

  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.name, normalized))
    .limit(1)

  return result[0]
}

// Add tags to a log
export async function addTagsToLog(
  logId: number,
  tagNames: string[]
): Promise<void> {
  const normalizedTags = tagNames.map(t => t.toLowerCase().trim())

  // Insert or ignore tags
  await db
    .insert(tags)
    .values(normalizedTags.map(name => ({ name })))
    .onConflictDoNothing()

  // Get tag IDs
  const tagRecords = await db
    .select()
    .from(tags)
    .where(inArray(tags.name, normalizedTags))

  // Create associations (ignore duplicates)
  await db
    .insert(logsTags)
    .values(tagRecords.map(tag => ({ logId, tagId: tag.id })))
    .onConflictDoNothing()
}

// Remove a tag from a log
export async function removeTagFromLog(
  logId: number,
  tagId: number
): Promise<void> {
  await db
    .delete(logsTags)
    .where(and(eq(logsTags.logId, logId), eq(logsTags.tagId, tagId)))
}

// Get unique hostnames for filtering
export async function getUniqueHostnames(): Promise<string[]> {
  const result = await db
    .selectDistinct({ hostname: logs.hostname })
    .from(logs)
    .where(sql`${logs.hostname} IS NOT NULL`)
    .orderBy(logs.hostname)
  return result.map(r => r.hostname).filter((h): h is string => h !== null)
}

// Get unique app names for filtering
export async function getUniqueAppnames(): Promise<string[]> {
  const result = await db
    .selectDistinct({ appname: logs.appname })
    .from(logs)
    .where(sql`${logs.appname} IS NOT NULL`)
    .orderBy(logs.appname)
  return result.map(r => r.appname).filter((a): a is string => a !== null)
}

// Helper: Load tags for a list of logs
async function loadTagsForLogs(
  logsData: Log[],
  logIds: number[]
): Promise<LogWithTags[]> {
  if (logIds.length === 0) {
    return logsData.map(log => ({ ...log, tags: [] }))
  }

  const tagAssociations = await db
    .select({
      logId: logsTags.logId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(logsTags)
    .innerJoin(tags, eq(logsTags.tagId, tags.id))
    .where(inArray(logsTags.logId, logIds))

  const tagsByLogId = new Map<number, { id: number; name: string }[]>()
  for (const assoc of tagAssociations) {
    const existing = tagsByLogId.get(assoc.logId) ?? []
    existing.push({ id: assoc.tagId, name: assoc.tagName })
    tagsByLogId.set(assoc.logId, existing)
  }

  return logsData.map(log => ({
    ...log,
    tags: tagsByLogId.get(log.id) ?? [],
  }))
}
