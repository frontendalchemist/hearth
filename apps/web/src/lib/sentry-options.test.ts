import { describe, expect, it } from 'vitest'
import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs'
import {
  commonOptions,
  scrubBreadcrumb,
  scrubEvent,
} from './sentry-options'

const baseEvent = (over: Partial<ErrorEvent> = {}): ErrorEvent => ({
  type: undefined,
  ...over,
})

describe('scrubEvent', () => {
  it('reduces user to its internal id', () => {
    const event = baseEvent({
      user: {
        id: 'cuid-123',
        email: 'someone@example.com',
        username: 'someone',
        ip_address: '10.0.0.1',
      },
    })
    const scrubbed = scrubEvent(event)
    expect(scrubbed?.user).toEqual({ id: 'cuid-123' })
  })

  it('strips query strings from request.url', () => {
    const event = baseEvent({
      request: {
        url: 'https://hearth.app/share?token=abc&recipient=ruth',
      },
    })
    expect(scrubEvent(event)?.request?.url).toBe('https://hearth.app/share')
  })

  it('drops cookies, query_string, and request body entirely', () => {
    const event = baseEvent({
      request: {
        url: 'https://hearth.app/api/upload',
        query_string: 'name=Ruth',
        cookies: { session: 'abc' },
        data: { filename: 'mom-diagnosis.pdf' },
      },
    })
    const scrubbed = scrubEvent(event)
    expect(scrubbed?.request?.cookies).toBeUndefined()
    expect(scrubbed?.request?.query_string).toBeUndefined()
    expect(scrubbed?.request?.data).toBeUndefined()
  })

  it('runs scrubBreadcrumb across the breadcrumbs trail', () => {
    const event = baseEvent({
      breadcrumbs: [
        { category: 'navigation', data: { from: '/', to: '/vault' } },
        { category: 'ui.input', message: 'typed: Ruth Smith' },
        { category: 'fetch', data: { url: 'https://x/?q=phi' } },
      ],
    })
    const scrubbed = scrubEvent(event)!
    // ui.input was dropped, others kept (with url query stripped).
    expect(scrubbed.breadcrumbs).toHaveLength(2)
    expect(scrubbed.breadcrumbs?.[0]?.category).toBe('navigation')
    expect(scrubbed.breadcrumbs?.[1]?.data?.url).toBe('https://x/')
  })

  it('returns events unchanged when there is nothing PII-shaped to remove', () => {
    const event = baseEvent({
      message: 'Database connection lost',
    })
    expect(scrubEvent(event)).toEqual(event)
  })
})

describe('scrubBreadcrumb', () => {
  it('drops ui.input breadcrumbs (form/typing values)', () => {
    const crumb: Breadcrumb = {
      category: 'ui.input',
      message: 'someone typed something',
    }
    expect(scrubBreadcrumb(crumb)).toBe(null)
  })

  it('strips query strings from data.url on fetch crumbs', () => {
    const crumb: Breadcrumb = {
      category: 'fetch',
      data: { url: 'https://api/?token=secret', method: 'GET', status_code: 200 },
    }
    const out = scrubBreadcrumb(crumb)
    expect(out?.data?.url).toBe('https://api/')
    expect(out?.data?.method).toBe('GET')
    expect(out?.data?.status_code).toBe(200)
  })

  it('removes body / response_body_size / request_body_size if present', () => {
    const crumb: Breadcrumb = {
      category: 'fetch',
      data: {
        url: 'https://api/',
        body: 'name=Ruth',
        response_body_size: 1024,
        request_body_size: 8,
      },
    }
    const out = scrubBreadcrumb(crumb)
    expect(out?.data?.body).toBeUndefined()
    expect(out?.data?.response_body_size).toBeUndefined()
    expect(out?.data?.request_body_size).toBeUndefined()
  })
})

describe('commonOptions', () => {
  // Five HIPAA-load-bearing flags. These mirror the analytics test pattern
  // — failing here flags a regression before the change can ship.
  it('disables sendDefaultPii', () => {
    expect(commonOptions.sendDefaultPii).toBe(false)
  })

  it('disables session replay (would capture DOM contents)', () => {
    expect(commonOptions.replaysSessionSampleRate).toBe(0)
    expect(commonOptions.replaysOnErrorSampleRate).toBe(0)
  })

  it('wires beforeSend and beforeBreadcrumb scrubbers', () => {
    expect(commonOptions.beforeSend).toBe(scrubEvent)
    expect(commonOptions.beforeBreadcrumb).toBe(scrubBreadcrumb)
  })

  it('keeps attachStacktrace on for richer error context', () => {
    expect(commonOptions.attachStacktrace).toBe(true)
  })
})
