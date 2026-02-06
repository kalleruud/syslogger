import path from 'node:path'
import * as schema from '../database/schema'

const isTesting = process.env.NODE_ENV === 'test'

const db_url = 'data/db.sqlite'
const database = new Database(isTesting ? ':memory:' : db_url)
database.pragma('journal_mode = WAL')

const db = drizzle(database, { schema })

migrate(db, {
  migrationsFolder: path.resolve('./drizzle'),
})

export { database }
export default db
