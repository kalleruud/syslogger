import { describe, expect, test } from 'bun:test'

import { FACILITIES } from '@/lib/facilities'
import { SEVERITIES } from '@/lib/severities'

import type { ParsedLog } from './base.parser'
import parseSyslog from './parser'

const testCases: {
  log: string
  expected: ParsedLog
}[] = [
  {
    log: '<30>Feb 20 00:19:00 media-seerr[15429]: 2026-02-19T23:19:00.002Z [debug][Jobs]: Starting scheduled job: Download Sync',
    expected: {
      parser: 'docker',
      log: {
        appname: 'media-seerr',
        facility: FACILITIES.daemons.level,
        hostname: null,
        message:
          '2026-02-19T23:19:00.002Z [debug][Jobs]: Starting scheduled job: Download Sync',
        msgid: null,
        procid: '15429',
        raw: '<30>Feb 20 00:19:00 media-seerr[15429]: 2026-02-19T23:19:00.002Z [debug][Jobs]: Starting scheduled job: Download Sync',
        severity: SEVERITIES.debug.level,
        timestamp: '2026-02-19T23:19:00.002Z',
      },
    },
  },
  {
    log: '<13>Feb 20 00:00:01 Svetlana move: mover: started',
    expected: {
      parser: 'rfc3164',
      log: {
        appname: 'move',
        facility: FACILITIES.user.level,
        hostname: 'Svetlana',
        message: 'mover: started',
        msgid: null,
        procid: null,
        raw: '<13>Feb 20 00:00:01 Svetlana move: mover: started',
        severity: SEVERITIES.notice.level,
        timestamp: '2026-02-19T23:00:01.000Z',
      },
    },
  },
  {
    log: '<30>Feb 20 00:45:25 media-unpackerr[15429]: [INFO] 2026/02/20 00:45:25.976377 sonarr.go:74: [Sonarr] Updated (http://media.vpn.local:8989): 0 Items Queued, 0 Retrieved',
    expected: {
      parser: 'docker',
      log: {
        appname: 'media-unpackerr',
        facility: FACILITIES.daemons.level,
        hostname: null,
        message:
          '[INFO] 2026/02/20 00:45:25.976377 sonarr.go:74: [Sonarr] Updated (http://media.vpn.local:8989): 0 Items Queued, 0 Retrieved',
        msgid: null,
        procid: '15429',
        raw: '<30>Feb 20 00:45:25 media-unpackerr[15429]: [INFO] 2026/02/20 00:45:25.976377 sonarr.go:74: [Sonarr] Updated (http://media.vpn.local:8989): 0 Items Queued, 0 Retrieved',
        severity: SEVERITIES.info.level,
        timestamp: '2026-02-20T00:45:25.976Z',
      },
    },
  },
]

describe('parseSyslog', () => {
  for (const [index, testCase] of testCases.entries()) {
    test(`parses syslog message #${index + 1}`, () => {
      const result = parseSyslog(testCase.log)

      expect(result).toEqual(testCase.expected)
    })
  }

  test('throws on empty docker syslog message', () => {
    const log = '<30>Feb 20 01:23:11 media-radarr[15429]: '

    expect(() => parseSyslog(log)).toThrow()
  })
})
