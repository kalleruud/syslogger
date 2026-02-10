import * as schema from '@/database/schema'
import config from '@/lib/config'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const dbDir = path.dirname(config.database.url.replace('file:', ''))
if (!(await Bun.file(dbDir).exists())) {
  mkdir(dbDir, { recursive: true })
}

const database = new Database(config.database.url, { create: true })

// Enable WAL mode for concurrent read/write performance
database.run('PRAGMA journal_mode = WAL;')
// Balance safety and speed for high-throughput logging
database.run('PRAGMA synchronous = NORMAL;')
// Prevent "database locked" errors under load
database.run('PRAGMA busy_timeout = 5000;')

const db = drizzle(database, { schema })

migrate(db, {
  migrationsFolder: path.resolve('./drizzle'),
})

export default db
