import * as schema from '@database/schema'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import path from 'node:path'

const isTesting = process.env.NODE_ENV === 'test'

const db_url = 'data/db.sqlite'
const database = new Database(isTesting ? ':memory:' : db_url, { create: true })
database.run('PRAGMA journal_mode = WAL;')

const db = drizzle(database, { schema })

migrate(db, {
  migrationsFolder: path.resolve('./drizzle'),
})

export default db
