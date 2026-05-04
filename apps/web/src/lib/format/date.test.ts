import { describe, it, expect } from 'vitest'
import { formatDate } from './date'

const fixed = new Date('2026-05-03T14:30:00Z')

describe('formatDate', () => {
  it('formats a Date with the requested locale and options', () => {
    const expected = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(fixed)

    expect(formatDate(fixed, 'en-US', { dateStyle: 'long', timeZone: 'UTC' })).toBe(
      expected,
    )
  })

  it('honors a non-English locale (proves the locale arg is plumbed through)', () => {
    const expected = new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(fixed)

    expect(formatDate(fixed, 'de-DE', { dateStyle: 'long', timeZone: 'UTC' })).toBe(
      expected,
    )
  })

  it('accepts an ISO string and a numeric epoch', () => {
    const opts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeZone: 'UTC' }
    const expected = new Intl.DateTimeFormat('en-US', opts).format(fixed)

    expect(formatDate(fixed.toISOString(), 'en-US', opts)).toBe(expected)
    expect(formatDate(fixed.getTime(), 'en-US', opts)).toBe(expected)
  })

  it('uses the runtime default format when no options are passed', () => {
    const expected = new Intl.DateTimeFormat('en-US').format(fixed)
    expect(formatDate(fixed, 'en-US')).toBe(expected)
  })
})
