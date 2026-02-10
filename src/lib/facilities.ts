export const FACILITIES = {
  kernel: { name: 'kernel messages', level: 0 },
  user: { name: 'user-level messages', level: 1 },
  mail: { name: 'mail system', level: 2 },
  daemons: { name: 'system daemons', level: 3 },
  security: { name: 'security/authorization messages', level: 4 },
  syslogd: { name: 'messages generated internally by syslogd', level: 5 },
  inline: { name: 'line printer subsystem', level: 6 },
  network: { name: 'network news subsystem', level: 7 },
  uucp: { name: 'UUCP subsystem', level: 8 },
  clock: { name: 'clock daemon', level: 9 },
  authorization: { name: 'security/authorization messages', level: 10 },
  ftp: { name: 'FTP daemon', level: 11 },
  ntp: { name: 'NTP subsystem', level: 12 },
  audit: { name: 'log audit', level: 13 },
  alert: { name: 'log alert', level: 14 },
  clock2: { name: 'clock daemon (note 2)', level: 15 },
  local0: { name: 'local use 0 (local0)', level: 16 },
  local1: { name: 'local use 1 (local1)', level: 17 },
  local2: { name: 'local use 2 (local2)', level: 18 },
  local3: { name: 'local use 3 (local3)', level: 19 },
  local4: { name: 'local use 4 (local4)', level: 20 },
  local5: { name: 'local use 5 (local5)', level: 21 },
  local6: { name: 'local use 6 (local6)', level: 22 },
  local7: { name: 'local use 7 (local7)', level: 23 },
} as const

const facilityValues = Object.values(FACILITIES)

export function getFacility(value: number) {
  if (value < 0 || value > 23)
    throw new Error(`Tried to get invalid facility: ${value}`)
  return facilityValues.find(e => e.level === value)!
}

export type FacilityName = keyof typeof FACILITIES
export type Facility = (typeof FACILITIES)[FacilityName]
