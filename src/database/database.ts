import * as schema from '@/database/schema'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import path from 'node:path'

const isTesting = process.env.NODE_ENV === 'test'

const db_url = 'data/db.sqlite'
const database = new Database(isTesting ? ':memory:' : db_url, { create: true })

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
