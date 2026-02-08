/**
 * Syslog severity levels (RFC 5424 Section 6.2.1)
 */
export enum Severity {
  Emergency = 0, // System is unusable
  Alert = 1, // Action must be taken immediately
  Critical = 2, // Critical conditions
  Error = 3, // Error conditions
  Warning = 4, // Warning conditions
  Notice = 5, // Normal but significant condition
  Informational = 6, // Informational messages
  Debug = 7, // Debug-level messages
}

/**
 * Syslog facility codes (RFC 5424 Section 6.2.1)
 */
export enum Facility {
  Kern = 0, // Kernel messages
  User = 1, // User-level messages
  Mail = 2, // Mail system
  Daemon = 3, // System daemons
  Auth = 4, // Security/authorization messages
  Syslog = 5, // Messages generated internally by syslogd
  Lpr = 6, // Line printer subsystem
  News = 7, // Network news subsystem
  Uucp = 8, // UUCP subsystem
  Cron = 9, // Clock daemon
  AuthPriv = 10, // Security/authorization messages (private)
  Ftp = 11, // FTP daemon
  Ntp = 12, // NTP subsystem
  LogAudit = 13, // Log audit
  LogAlert = 14, // Log alert
  Clock = 15, // Clock daemon
  Local0 = 16, // Local use 0
  Local1 = 17, // Local use 1
  Local2 = 18, // Local use 2
  Local3 = 19, // Local use 3
  Local4 = 20, // Local use 4
  Local5 = 21, // Local use 5
  Local6 = 22, // Local use 6
  Local7 = 23, // Local use 7
}

/**
 * Parsed syslog message structure
 */
export interface ParsedLog {
  // Core fields (always present)
  timestamp: string // ISO 8601 format
  severity: number // 0-7
  message: string
  raw: string // Original message

  // Optional fields (may be null)
  facility?: number // 0-23
  hostname?: string
  appname?: string
  procid?: string
  msgid?: string
  structuredData?: string // RFC 5424 structured data
}

/**
 * Parser result with metadata
 */
export interface ParseResult {
  success: boolean
  log?: ParsedLog
  error?: string
  parserUsed?: 'rfc5424' | 'rfc3164' | 'docker' | 'fallback'
}

/**
 * Calculate facility and severity from priority value
 * Priority = (Facility * 8) + Severity
 */
export function parsePriority(priority: number): {
  facility: number
  severity: number
} {
  const facility = Math.floor(priority / 8)
  const severity = priority % 8
  return { facility, severity }
}

/**
 * Calculate priority from facility and severity
 */
export function calculatePriority(facility: number, severity: number): number {
  return facility * 8 + severity
}

/**
 * Get human-readable severity name
 */
export function getSeverityName(severity: number): string {
  return Severity[severity] ?? 'Unknown'
}

/**
 * Get human-readable facility name
 */
export function getFacilityName(facility: number): string {
  return Facility[facility] ?? 'Unknown'
}
