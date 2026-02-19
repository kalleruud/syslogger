import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

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

// Tags table - unique tag names for log categorization
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Junction table for many-to-many logs-tags relationship
export const logsTags = sqliteTable(
  'logs_tags',
  {
    logId: integer('log_id')
      .notNull()
      .references(() => logs.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => [
    primaryKey({ columns: [table.logId, table.tagId] }),
    index('idx_logs_tags_tag_id').on(table.tagId),
  ]
)

// Relations for Drizzle query builder
export const logsRelations = relations(logs, ({ many }) => ({
  logsTags: many(logsTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  logsTags: many(logsTags),
}))

export const logsTagsRelations = relations(logsTags, ({ one }) => ({
  log: one(logs, {
    fields: [logsTags.logId],
    references: [logs.id],
  }),
  tag: one(tags, {
    fields: [logsTags.tagId],
    references: [tags.id],
  }),
}))

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export type LogWithTags = Log & { tags: Tag[] }

export function isLogsWithTags(data: unknown): data is LogWithTags {
  if (typeof data !== 'object' || data === null) return false
  const record = data as Record<string, unknown>
  return (
    typeof record.id === 'number' &&
    typeof record.timestamp === 'string' &&
    typeof record.raw === 'string'
  )
}
