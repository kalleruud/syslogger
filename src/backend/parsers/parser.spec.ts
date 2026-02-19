import type { Log } from '@/database/schema'
import { FACILITIES } from '@/lib/facilities'
import { SEVERITIES } from '@/lib/severities'

const testCases: {
  log: string
  expected: Omit<Log, 'id' | 'createdAt' | 'raw'>
}[] = [
  {
    log: '<30>Feb 20 00:19:00 media-seerr[15429]: 2026-02-19T23:19:00.002Z [debug][Jobs]: Starting scheduled job: Download Sync',
    expected: {
      timestamp: '2026-02-20T00:19:00Z',
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
      timestamp: '2026-02-20T00:00:01Z',
      severity: SEVERITIES.notice.level,
      facility: FACILITIES.user.level,
      hostname: 'Svetlana',
      appname: 'move',
      procid: null,
      msgid: null,
      message: 'mover: started',
    },
  },
]
