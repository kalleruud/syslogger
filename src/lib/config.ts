const config = {
  development: process.env.NODE_ENV !== 'production',
  port: Number.parseInt(process.env.SYSLOGGER_PORT ?? '3791'),
  syslog: {
    port: Number.parseInt(process.env.SYSLOGGER_SYSLOG_PORT ?? '5140'),
  },
  database: {
    url: process.env.SYSLOGGER_DB_URL || './dev.db',
  },
  cors: {
    origin: process.env.SYSLOGGER_CORS_ORIGIN || '*',
  },
} as const

export default config
