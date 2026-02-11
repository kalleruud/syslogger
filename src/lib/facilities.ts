export const FACILITIES = {
  kernel: { name: 'kernel', descriptopn: 'kernel messages', level: 0 },
  user: { name: 'user', descriptopn: 'user-level messages', level: 1 },
  mail: { name: 'mail', descriptopn: 'mail system', level: 2 },
  daemons: { name: 'daemons', descriptopn: 'system daemons', level: 3 },
  security: {
    name: 'security',
    descriptopn: 'security/authorization messages',
    level: 4,
  },
  syslogd: {
    name: 'syslogd',
    descriptopn: 'messages generated internally by syslogd',
    level: 5,
  },
  inline: { name: 'inline', descriptopn: 'line printer subsystem', level: 6 },
  network: { name: 'network', descriptopn: 'network news subsystem', level: 7 },
  uucp: { name: 'uucp', descriptopn: 'UUCP subsystem', level: 8 },
  clock: { name: 'clock', descriptopn: 'clock daemon', level: 9 },
  authorization: {
    name: 'authorization',
    descriptopn: 'security/authorization messages',
    level: 10,
  },
  ftp: { name: 'ftp', descriptopn: 'FTP daemon', level: 11 },
  ntp: { name: 'ntp', descriptopn: 'NTP subsystem', level: 12 },
  audit: { name: 'audit', descriptopn: 'log audit', level: 13 },
  alert: { name: 'alert', descriptopn: 'log alert', level: 14 },
  clock2: { name: 'clock2', descriptopn: 'clock daemon (note 2)', level: 15 },
  local0: { name: 'local0', descriptopn: 'local use 0 (local0)', level: 16 },
  local1: { name: 'local1', descriptopn: 'local use 1 (local1)', level: 17 },
  local2: { name: 'local2', descriptopn: 'local use 2 (local2)', level: 18 },
  local3: { name: 'local3', descriptopn: 'local use 3 (local3)', level: 19 },
  local4: { name: 'local4', descriptopn: 'local use 4 (local4)', level: 20 },
  local5: { name: 'local5', descriptopn: 'local use 5 (local5)', level: 21 },
  local6: { name: 'local6', descriptopn: 'local use 6 (local6)', level: 22 },
  local7: { name: 'local7', descriptopn: 'local use 7 (local7)', level: 23 },
} as const

const facilityValues = Object.values(FACILITIES)

export function getFacility(value: number) {
  if (value < 0 || value > 23)
    throw new Error(`Tried to get invalid facility: ${value}`)
  return facilityValues.find(e => e.level === value)!
}

export type FacilityName = keyof typeof FACILITIES
export type Facility = (typeof FACILITIES)[FacilityName]
