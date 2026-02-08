export interface ParsedLog {
  timestamp: string
  severity: number
  message: string
  raw: string
  facility?: number
  hostname?: string
  appname?: string
  procid?: string
  msgid?: string
  structuredData?: string
}

export interface ParseResult {
  success: boolean
  log?: ParsedLog
  error?: string
  parserUsed?: 'rfc5424' | 'rfc3164' | 'docker' | 'fallback'
}

export const parsePriority = (priority: number) => ({
  facility: Math.floor(priority / 8),
  severity: priority % 8,
})
