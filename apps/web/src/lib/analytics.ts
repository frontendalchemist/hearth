'use client'

import posthog from 'posthog-js'

let initialized = false

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: '/ingest',
    // Manual pageview control — PHI can appear in URL params
    capture_pageview: false,
    capture_pageleave: true,
    // CRITICAL: disable auto-capture in a HIPAA-adjacent app
    autocapture: false,
    // Mask text content and attributes in session replay
    mask_all_text: true,
    mask_all_element_attributes: true,
  })

  initialized = true
}

/**
 * Track a product analytics event.
 *
 * PHI rule: never include names, DOBs, diagnoses, medication names,
 * document titles, or anything that identifies a care recipient.
 * Log feature usage patterns only.
 *
 * Good:  track('document_uploaded', { category: 'legal', file_type: 'pdf' })
 * Bad:   track('document_uploaded', { filename: "Mom_diagnosis.pdf" })
 */
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, properties)
}

export function identifyUser(userId: string) {
  if (typeof window === 'undefined') return
  // Only identify by internal ID — never pass name or email to PostHog
  posthog.identify(userId)
}

export function resetAnalytics() {
  if (typeof window === 'undefined') return
  posthog.reset()
}
