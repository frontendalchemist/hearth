import { describe, expect, it } from 'vitest'
import { decryptPii, encryptPii } from './crypto'

describe('crypto stubs', () => {
  it('encryptPii returns plaintext unchanged in Stage 1', async () => {
    const result = await encryptPii('123-45-6789')
    expect(result).toBe('123-45-6789')
  })

  it('decryptPii returns input unchanged in Stage 1', async () => {
    const result = await decryptPii('123-45-6789')
    expect(result).toBe('123-45-6789')
  })

  it('round-trip is lossless', async () => {
    const original = 'sensitive-pii-value-here'
    const round = await decryptPii(await encryptPii(original))
    expect(round).toBe(original)
  })
})
