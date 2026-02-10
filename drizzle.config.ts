import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  dialect: 'sqlite',
  schema: './src/database/schema.ts',
  casing: 'camelCase',
  dbCredentials: {
    url: 'data/db.sqlite',
  },
})
