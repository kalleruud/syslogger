import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Logs table - primary storage for parsed syslog messages
export const logs = sqliteTable(
  'logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text('timestamp').notNull(),
    severity: integer('severity').notNull(),
    facility: integer('facility'),
    hostname: text('hostname'),
    appname: text('appname'),
    procid: text('procid'),
    msgid: text('msgid'),
    message: text('message').notNull(),
    raw: text('raw').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [
    index('idx_logs_timestamp').on(table.timestamp),
    index('idx_logs_severity').on(table.severity),
    index('idx_logs_hostname').on(table.hostname),
    index('idx_logs_appname').on(table.appname),
    index('idx_logs_severity_timestamp').on(table.severity, table.timestamp),
  ]
)

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert

export function isLogRecord(data: unknown): data is Log {
  if (typeof data !== 'object' || data === null) return false
  const record = data as Record<string, unknown>
  return (
    typeof record.id === 'number' &&
    typeof record.timestamp === 'string' &&
    typeof record.raw === 'string'
  )
}
