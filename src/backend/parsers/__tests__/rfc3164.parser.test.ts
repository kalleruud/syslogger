import { describe, expect, test } from 'bun:test'
import parseSyslog from '../parser'

describe('RFC3164 parser', () => {
  test('parses hostname and tag without procid', () => {
    const raw = '<13>Feb 20 00:00:01 Svetlana move: mover: started'
    const { log } = parseSyslog(raw)

    expect(log.hostname).toBe('Svetlana')
    expect(log.appname).toBe('move')
    expect(log.procid).toBeNull()
    expect(log.message).toBe('mover: started')
    expect(log.timestamp.endsWith('Z')).toBe(true)
  })

  test('parses hostname and tag with procid', () => {
    const raw = '<34>Feb 20 00:00:01 Svetlana mover[451]: started'
    const { log } = parseSyslog(raw)

    expect(log.hostname).toBe('Svetlana')
    expect(log.appname).toBe('mover')
    expect(log.procid).toBe('451')
    expect(log.message).toBe('started')
  })
})
