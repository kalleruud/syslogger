import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const syslogs = sqliteTable(
  'syslogs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text('timestamp').notNull(),
    facility: integer('facility'),
    severity: integer('severity'),
    hostname: text('hostname'),
    appname: text('appname'),
    procid: text('procid'),
    msgid: text('msgid'),
    message: text('message').notNull(),
    raw: text('raw'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    timestampIdx: index('idx_timestamp').on(table.timestamp),
    severityIdx: index('idx_severity').on(table.severity),
    hostnameIdx: index('idx_hostname').on(table.hostname),
    appnameIdx: index('idx_appname').on(table.appname),
  })
)
