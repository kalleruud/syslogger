import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import * as schema from './schema.js'

const DB_PATH = process.env.DB_PATH ?? './data/logs.db'

const sqlite = new Database(DB_PATH, { create: true })
export const db = drizzle(sqlite, { schema })
export { sqlite }

// Run migrations on startup
migrate(db, { migrationsFolder: './drizzle' })
