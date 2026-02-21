import { and, desc, inArray, like, lt, or, SQL, sql } from 'drizzle-orm'
import db from './database'
import { type Log, logs, type NewLog } from './schema'

export interface LogFilters {
  severity?: number[]
  hostname?: string[]
  appname?: string[]
  search?: string
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

/**
 * Build WHERE conditions for user filters only (severity, hostname, appname, search)
 * Used for counting total matching logs
 */
const buildFilterConditions = (filters: LogFilters) => {
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

  return conditions
}

/**
 * Build WHERE conditions for pagination only (beforeTimestamp)
 * Used for fetching specific pages of data
 */
const buildPaginationConditions = (filters: LogFilters) => {
  const conditions: SQL[] = []

  if (filters.beforeTimestamp) {
    conditions.push(lt(logs.timestamp, filters.beforeTimestamp))
  }

  return conditions
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
): Promise<PaginatedResult<Log>> {
  const limit = filters.limit ?? DEFAULT_LIMIT
  const offset = filters.offset ?? DEFAULT_OFFSET

  // For counting: use ONLY user filters (excludes beforeTimestamp)
  // This ensures total represents ALL logs matching filters, not just paginated subset
  const filterConditions = buildFilterConditions(filters)
  const filterWhereClause =
    filterConditions.length > 0 ? and(...filterConditions) : undefined

  // For fetching data: use BOTH user filters AND pagination filters
  const paginationConditions = buildPaginationConditions(filters)
  const allConditions = [...filterConditions, ...paginationConditions]
  const dataWhereClause =
    allConditions.length > 0 ? and(...allConditions) : undefined

  // Count with filter conditions only (excludes beforeTimestamp for accurate total)
  const total = await countMatchingLogs(filterWhereClause)

  // Fetch with both filter and pagination conditions
  const logsResult = await fetchPaginatedLogs(dataWhereClause, limit, offset)

  return { data: logsResult, total, limit, offset }
}

// Insert a new log entry
export async function insertLog(log: NewLog): Promise<Log> {
  const result = await db.insert(logs).values(log).returning()
  return result[0]!
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
