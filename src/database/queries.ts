import {
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  like,
  lt,
  or,
  SQL,
  sql,
} from 'drizzle-orm'
import db from './database'
import {
  type Log,
  logs,
  logsTags,
  type LogWithTags,
  type NewLog,
  type Tag,
  tags,
} from './schema'

export interface LogFilters {
  severity?: number[]
  hostname?: string[]
  appname?: string[]
  search?: string
  tagIds?: number[]
  limit?: number
  offset?: number
  beforeTimestamp?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

const DEFAULT_LIMIT = 100
const DEFAULT_OFFSET = 0
const EMPTY_RESULT = { data: [], total: 0 }

const buildWhereConditions = (filters: LogFilters) => {
  const conditions: SQL[] = []

  if (filters.severity?.length) {
    conditions.push(inArray(logs.severity, filters.severity))
  }
  if (filters.hostname?.length) {
    conditions.push(inArray(logs.hostname, filters.hostname))
  }
  if (filters.appname?.length) {
    conditions.push(inArray(logs.appname, filters.appname))
  }
  if (filters.search) {
    // Full-text search across message, appname, and hostname fields
    conditions.push(
      or(
        like(logs.message, `%${filters.search}%`),
        like(logs.appname, `%${filters.search}%`),
        like(logs.hostname, `%${filters.search}%`)
      )!
    )
  }
  if (filters.beforeTimestamp) {
    conditions.push(lt(logs.timestamp, filters.beforeTimestamp))
  }

  return conditions
}

const getLogIdsMatchingTags = async (tagIds: number[]): Promise<number[]> => {
  const taggedLogs = await db
    .select({ logId: logsTags.logId })
    .from(logsTags)
    .where(inArray(logsTags.tagId, tagIds))
    .groupBy(logsTags.logId)

  return taggedLogs.map(result => result.logId)
}

const countMatchingLogs = async (
  whereClause: ReturnType<typeof and> | undefined
): Promise<number> => {
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(logs)
    .where(whereClause)

  return countResult[0]?.count ?? 0
}

const fetchPaginatedLogs = async (
  whereClause: ReturnType<typeof and> | undefined,
  limit: number,
  offset: number
): Promise<Log[]> => {
  return db
    .select()
    .from(logs)
    .where(whereClause)
    .orderBy(desc(logs.timestamp))
    .limit(limit)
    .offset(offset)
}

// Get logs with optional filters and pagination
export async function getLogs(
  filters: LogFilters = {}
): Promise<PaginatedResult<LogWithTags>> {
  const limit = filters.limit ?? DEFAULT_LIMIT
  const offset = filters.offset ?? DEFAULT_OFFSET

  const conditions = buildWhereConditions(filters)

  // Apply tag filtering if specified
  if (filters.tagIds?.length) {
    const logIdsWithTags = await getLogIdsMatchingTags(filters.tagIds)

    if (logIdsWithTags.length === 0) {
      return { ...EMPTY_RESULT, limit, offset }
    }

    conditions.push(inArray(logs.id, logIdsWithTags))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const total = await countMatchingLogs(whereClause)
  const logsResult = await fetchPaginatedLogs(whereClause, limit, offset)
  const logsWithTags = await loadTagsForLogs(logsResult)

  return { data: logsWithTags, total, limit, offset }
}

// Insert a new log entry
export async function insertLog(log: NewLog): Promise<Log> {
  const result = await db.insert(logs).values(log).returning()
  return result[0]!
}

const normalizeTagName = (tagName: string): string =>
  tagName.toLowerCase().trim()

const normalizeTagNames = (tagNames: string[]): string[] =>
  tagNames.map(normalizeTagName)

const ensureTagsExist = async (tagNames: string[]): Promise<void> => {
  await db
    .insert(tags)
    .values(tagNames.map(name => ({ name })))
    .onConflictDoNothing()
}

const fetchTagsByNames = async (tagNames: string[]): Promise<Tag[]> => {
  return db.select().from(tags).where(inArray(tags.name, tagNames))
}

const createLogTagAssociations = async (
  logId: number,
  tagRecords: Tag[]
): Promise<void> => {
  await db.insert(logsTags).values(
    tagRecords.map(tag => ({
      logId,
      tagId: tag.id,
    }))
  )
}

// Insert a log with tags (creates tags if they don't exist)
export async function insertLogWithTags(
  log: NewLog,
  tagNames: string[]
): Promise<LogWithTags> {
  const insertedLog = await insertLog(log)

  if (tagNames.length === 0) {
    return { ...insertedLog, tags: [] }
  }

  const normalizedTags = normalizeTagNames(tagNames)
  await ensureTagsExist(normalizedTags)

  const tagRecords = await fetchTagsByNames(normalizedTags)
  await createLogTagAssociations(insertedLog.id, tagRecords)

  return {
    ...insertedLog,
    tags: tagRecords,
  }
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
): Promise<{ id: number; name: string }> {
  const normalized = normalizeTagName(name)
  await ensureTagsExist([normalized])

  const result = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.name, normalized))
    .limit(1)

  return result[0]!
}

// Add tags to a log
export async function addTagsToLog(
  logId: number,
  tagNames: string[]
): Promise<void> {
  const normalizedTags = normalizeTagNames(tagNames)
  await ensureTagsExist(normalizedTags)

  const tagRecords = await fetchTagsByNames(normalizedTags)

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

const filterNonNullValues = <T>(value: T | null): value is T => {
  return value !== null
}

const getDistinctFieldValues = async (
  field: typeof logs.hostname | typeof logs.appname
): Promise<string[]> => {
  const result = await db
    .selectDistinct({ value: field })
    .from(logs)
    .where(sql`${field} IS NOT NULL`)
    .orderBy(field)

  return result.map(record => record.value).filter(filterNonNullValues)
}

// Get unique hostnames for filtering
export async function getUniqueHostnames(): Promise<string[]> {
  return getDistinctFieldValues(logs.hostname)
}

// Get unique app names for filtering
export async function getUniqueAppnames(): Promise<string[]> {
  return getDistinctFieldValues(logs.appname)
}

async function fetchTagAssociationsForLogs(logIds: number[]) {
  return db
    .select({
      ...getTableColumns(tags),
      logId: logsTags.logId,
    })
    .from(logsTags)
    .innerJoin(tags, eq(logsTags.tagId, tags.id))
    .where(inArray(logsTags.logId, logIds))
}

function groupTagsByLogId(
  associations: Awaited<ReturnType<typeof fetchTagAssociationsForLogs>>
): Map<number, Tag[]> {
  const tagsByLogId = new Map<number, Tag[]>()

  for (const association of associations) {
    const existingTags = tagsByLogId.get(association.logId) ?? []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logId, ...tag } = association
    existingTags.push(tag)
    tagsByLogId.set(association.logId, existingTags)
  }

  return tagsByLogId
}

const attachTagsToLogs = (
  logsData: Log[],
  tagsByLogId: Map<number, Tag[]>
): LogWithTags[] => {
  return logsData.map(log => ({
    ...log,
    tags: tagsByLogId.get(log.id) ?? [],
  }))
}

// Helper: Load tags for a list of logs
async function loadTagsForLogs(logs: Log[]): Promise<LogWithTags[]> {
  if (logs.length === 0) {
    return logs.map(log => ({ ...log, tags: [] }))
  }

  const associations = await fetchTagAssociationsForLogs(logs.map(l => l.id))
  const tagsByLogId = groupTagsByLogId(associations)
  return attachTagsToLogs(logs, tagsByLogId)
}
