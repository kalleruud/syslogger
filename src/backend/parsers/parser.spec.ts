import { describe, expect, test } from 'bun:test'

import type { Log } from '@/database/schema'
import { FACILITIES } from '@/lib/facilities'
import { SEVERITIES } from '@/lib/severities'

import parseSyslog from './parser'

const testCases: {
  log: string
  expected: Omit<Log, 'id' | 'createdAt' | 'raw'>
}[] = [
  {
    log: '<30>Feb 20 00:19:00 media-seerr[15429]: 2026-02-19T23:19:00.002Z [debug][Jobs]: Starting scheduled job: Download Sync',
    expected: {
      timestamp: '2026-02-19T23:19:00.002Z',
      severity: SEVERITIES.debug.level,
      facility: FACILITIES.daemons.level,
      hostname: null,
      appname: 'media-seerr',
      procid: '15429',
      msgid: null,
      message:
        '2026-02-19T23:19:00.002Z [debug][Jobs]: Starting scheduled job: Download Sync',
    },
  },
  {
    log: '<13>Feb 20 00:00:01 Svetlana move: mover: started',
    expected: {
      timestamp: '2026-02-19T23:00:01.000Z',
      severity: SEVERITIES.notice.level,
      facility: FACILITIES.user.level,
      hostname: 'Svetlana',
      appname: 'move',
      procid: null,
      msgid: null,
      message: 'mover: started',
    },
  },
  {
    log: '<30>Feb 20 00:45:25 media-unpackerr[15429]: [INFO] 2026/02/20 00:45:25.976377 sonarr.go:74: [Sonarr] Updated (http://media.vpn.local:8989): 0 Items Queued, 0 Retrieved',
    expected: {
      timestamp: '2026-02-20T00:45:25.976Z',
      severity: SEVERITIES.info.level,
      facility: FACILITIES.daemons.level,
      hostname: null,
      appname: 'media-unpackerr',
      procid: '15429',
      msgid: null,
      message:
        '[INFO] 2026/02/20 00:45:25.976377 sonarr.go:74: [Sonarr] Updated (http://media.vpn.local:8989): 0 Items Queued, 0 Retrieved',
    },
  },
]

describe('parseSyslog', () => {
  for (const [index, testCase] of testCases.entries()) {
    test(`parses syslog message #${index + 1}`, () => {
      const result = parseSyslog(testCase.log)

      expect(result.log).toEqual({
        ...testCase.expected,
        raw: testCase.log,
      })
    })
  }
})
