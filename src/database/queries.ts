import { and, desc, eq, inArray, like, sql } from 'drizzle-orm'
import db from './database'
import { type Log, logs, logsTags, type NewLog, type Tag, tags } from './schema'

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

const DEFAULT_LIMIT = 100
const DEFAULT_OFFSET = 0
const EMPTY_RESULT = { data: [], total: 0 }

const buildWhereConditions = (filters: LogFilters) => {
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
  const logIds = logsResult.map(log => log.id)
  const logsWithTags = await loadTagsForLogs(logsResult, logIds)

  return { data: logsWithTags, total, limit, offset }
}

// Get a single log by ID with tags
export async function getLogById(id: number): Promise<LogWithTags | null> {
  const result = await db.select().from(logs).where(eq(logs.id, id)).limit(1)

  if (result.length === 0) return null

  const logsWithTags = await loadTagsForLogs(result, [id])
  return logsWithTags[0] ?? null
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

const formatTagsForResponse = (
  tagRecords: Tag[]
): { id: number; name: string }[] => {
  return tagRecords.map(tag => ({ id: tag.id, name: tag.name }))
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
    tags: formatTagsForResponse(tagRecords),
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

const fetchTagAssociationsForLogs = async (logIds: number[]) => {
  return db
    .select({
      logId: logsTags.logId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(logsTags)
    .innerJoin(tags, eq(logsTags.tagId, tags.id))
    .where(inArray(logsTags.logId, logIds))
}

const groupTagsByLogId = (
  associations: Awaited<ReturnType<typeof fetchTagAssociationsForLogs>>
): Map<number, { id: number; name: string }[]> => {
  const tagsByLogId = new Map<number, { id: number; name: string }[]>()

  for (const association of associations) {
    const existingTags = tagsByLogId.get(association.logId) ?? []
    existingTags.push({ id: association.tagId, name: association.tagName })
    tagsByLogId.set(association.logId, existingTags)
  }

  return tagsByLogId
}

const attachTagsToLogs = (
  logsData: Log[],
  tagsByLogId: Map<number, { id: number; name: string }[]>
): LogWithTags[] => {
  return logsData.map(log => ({
    ...log,
    tags: tagsByLogId.get(log.id) ?? [],
  }))
}

// Helper: Load tags for a list of logs
async function loadTagsForLogs(
  logsData: Log[],
  logIds: number[]
): Promise<LogWithTags[]> {
  if (logIds.length === 0) {
    return logsData.map(log => ({ ...log, tags: [] }))
  }

  const associations = await fetchTagAssociationsForLogs(logIds)
  const tagsByLogId = groupTagsByLogId(associations)
  return attachTagsToLogs(logsData, tagsByLogId)
}
