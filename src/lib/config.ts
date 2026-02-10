import { env } from 'node:process'

export const config = {
  development: env.NODE_ENV !== 'production',
  port: env.PORT || 3000,
  database: {
    url: env.DATABASE_URL || './dev.db',
  },
  cors: {
    origin: env.CORS_ORIGIN || '*',
  },
}
