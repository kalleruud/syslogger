import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import * as schema from './schema.js'

const DB_PATH = Bun.env.DB_PATH ?? './data/logs.db'

const sqlite = new Database(DB_PATH, { create: true })
export const db = drizzle(sqlite, { schema })
export { sqlite }

export function runMigrations(): void {
  try {
    migrate(db, { migrationsFolder: './drizzle' })
    console.log('Database migrations completed')
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Database schema already up to date')
    } else {
      throw error
    }
  }
}
