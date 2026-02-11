export const SEVERITIES = {
  emergency: {
    level: 0,
    name: 'emergency',
    description: 'system is unusable',
    synonyms: new Set(['emergency']),
  },
  alert: {
    level: 1,
    name: 'alert',
    description: 'action must be taken immediately',
    synonyms: new Set(['alert']),
  },
  critical: {
    level: 2,
    name: 'critical',
    description: 'critical conditions',
    synonyms: new Set(['critical', 'crit']),
  },
  error: {
    level: 3,
    name: 'error',
    description: 'error conditions',
    synonyms: new Set(['error', 'err']),
  },
  warning: {
    level: 4,
    name: 'warning',
    description: 'warning conditions',
    synonyms: new Set(['warning', 'warn']),
  },
  notice: {
    level: 5,
    name: 'notice',
    description: 'normal but significant condition',
    synonyms: new Set(['notice']),
  },
  info: {
    level: 6,
    name: 'info',
    description: 'informational messages',
    synonyms: new Set(['info', 'information', 'log']),
  },
  debug: {
    level: 7,
    name: 'debug',
    description: 'debug-level messages',
    synonyms: new Set(['debug', 'trace']),
  },
} as const

const severityValues = Object.values(SEVERITIES)

export function getSeverity(value: number) {
  if (value < 0 || value > 7)
    throw new Error(`Tried to get invalid severity: ${value}`)
  return severityValues.find(s => s.level === value)!
}

export type SeverityName = keyof typeof SEVERITIES
export type Severity = (typeof SEVERITIES)[SeverityName]
