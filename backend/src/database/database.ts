import {
  and,
  count,
  desc,
  eq,
  inArray,
  like,
  or,
  sql,
  SQL,
} from 'drizzle-orm'
import { db, sqlite } from './db.js'
import { syslogs } from './schema.js'
import { SyslogMessage } from '../types.js'

export async function insertLog(
  log: Omit<SyslogMessage, 'id' | 'created_at'>
): Promise<SyslogMessage> {
  const [inserted] = await db
    .insert(syslogs)
    .values({
      timestamp: log.timestamp,
      facility: log.facility,
      severity: log.severity,
      hostname: log.hostname,
      appname: log.appname,
      procid: log.procid,
      msgid: log.msgid,
      message: log.message,
      raw: log.raw,
    })
    .returning()

  return inserted as SyslogMessage
}

export interface LogQuery {
  limit?: number
  offset?: number
  severities?: number[]
  appnames?: string[]
  hostname?: string
  search?: string
}

function buildWhereConditions(query: LogQuery): SQL[] {
  const conditions: SQL[] = []

  if (query.severities && query.severities.length > 0) {
    conditions.push(inArray(syslogs.severity, query.severities))
  }

  if (query.appnames && query.appnames.length > 0) {
    conditions.push(inArray(syslogs.appname, query.appnames))
  }

  if (query.hostname) {
    conditions.push(eq(syslogs.hostname, query.hostname))
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`
    conditions.push(
      or(
        like(syslogs.message, searchTerm),
        like(syslogs.appname, searchTerm),
        like(syslogs.hostname, searchTerm)
      )!
    )
  }

  return conditions
}

export function getLogs(query: LogQuery = {}): SyslogMessage[] {
  const conditions = buildWhereConditions(query)

  const result = db
    .select()
    .from(syslogs)
    .where(and(...conditions))
    .orderBy(desc(syslogs.timestamp))
    .limit(query.limit ?? 100)
    .offset(query.offset ?? 0)
    .all()

  return result as SyslogMessage[]
}

export function getLogCount(query: LogQuery = {}): number {
  const conditions = buildWhereConditions(query)

  const [result] = db
    .select({ count: count() })
    .from(syslogs)
    .where(and(...conditions))
    .all()

  return result.count
}

export function getUniqueAppnames(): string[] {
  const rows = db
    .selectDistinct({ appname: syslogs.appname })
    .from(syslogs)
    .where(
      and(
        sql`${syslogs.appname} IS NOT NULL`,
        sql`${syslogs.appname} != ''`
      )
    )
    .orderBy(syslogs.appname)
    .all()

  return rows.map(r => r.appname!)
}

export function deleteOldLogs(retentionDays: number): number {
  const stmt = sqlite.prepare(`
    DELETE FROM syslogs
    WHERE severity > 4
    AND datetime(created_at) < datetime('now', '-' || ? || ' days')
  `)
  const result = stmt.run(retentionDays)
  return result.changes
}

export function closeDatabase(): void {
  sqlite.close()
}
