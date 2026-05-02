#!/usr/bin/env node
// Runs axe-core against every story in a running Storybook instance.
// Storybook 10 + @storybook/test-runner 0.23 are not yet compatible, so this
// is a stand-in that uses Playwright + axe-playwright directly.
//
// Prereqs:
//   1. pnpm storybook   (or pnpm build-storybook && pnpm dlx http-server storybook-static -p 6006)
//   2. pnpm exec playwright install chromium  (one-time)
//
// Usage:
//   pnpm a11y-audit                 # default WCAG 2.2 AA
//   STORYBOOK_URL=http://… pnpm a11y-audit
//   AXE_TAGS=wcag2a,wcag2aa pnpm a11y-audit

import { chromium } from '@playwright/test'
import { injectAxe, getViolations } from 'axe-playwright'

const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006'
const AXE_TAGS = (process.env.AXE_TAGS || 'wcag2a,wcag2aa,wcag21aa,wcag22aa')
  .split(',')
  .map((t) => t.trim())

async function fetchStoryIndex() {
  const res = await fetch(`${STORYBOOK_URL}/index.json`)
  if (!res.ok) {
    throw new Error(
      `Couldn't fetch ${STORYBOOK_URL}/index.json (${res.status}). Is Storybook running?`,
    )
  }
  const json = await res.json()
  return Object.values(json.entries).filter((e) => e.type === 'story')
}

function formatViolation(v) {
  const targets = v.nodes
    .slice(0, 3)
    .map((n) => `      · ${n.target.join(' › ')}`)
    .join('\n')
  return [
    `    ✗ [${v.impact}] ${v.id}: ${v.help}`,
    `      ${v.helpUrl}`,
    targets,
  ].join('\n')
}

async function main() {
  const stories = await fetchStoryIndex()
  console.log(
    `Auditing ${stories.length} stories at ${STORYBOOK_URL}\n  axe tags: ${AXE_TAGS.join(', ')}\n`,
  )

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  let totalViolations = 0
  const failures = []

  for (const story of stories) {
    const url = `${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`
    await page.goto(url, { waitUntil: 'networkidle' })
    await injectAxe(page)

    const violations = await getViolations(page, '#storybook-root', {
      runOnly: { type: 'tag', values: AXE_TAGS },
    })

    if (violations.length === 0) {
      console.log(`  ✓ ${story.title} / ${story.name}`)
    } else {
      totalViolations += violations.length
      failures.push({ story, violations })
      console.log(`  ✗ ${story.title} / ${story.name} — ${violations.length} violation(s)`)
      for (const v of violations) {
        console.log(formatViolation(v))
      }
    }
  }

  await browser.close()

  console.log(
    `\n${stories.length - failures.length}/${stories.length} stories pass · ${totalViolations} total violations`,
  )

  if (totalViolations > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
