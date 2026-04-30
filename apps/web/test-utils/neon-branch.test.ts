import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.resolve(__dirname, '..', 'node_modules', '.cache', 'neon-test-branch.json')

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  process.env.NEON_API_KEY = 'fake-key'
  process.env.NEON_PROJECT_ID = 'fake-project'
  process.env.GITHUB_RUN_ID = '12345'
})

afterEach(async () => {
  vi.unstubAllGlobals()
  await fs.unlink(CACHE_FILE).catch(() => {})
})

const okJson = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)

const errResponse = (status: number, body = '') =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  } as Response)

describe('setupNeonBranch', () => {
  it('creates a branch from the default branch and returns both pooled and direct URLs', async () => {
    fetchMock
      // GET /branches → list, find default
      .mockReturnValueOnce(
        okJson({
          branches: [
            { id: 'br-other', name: 'staging', default: false },
            { id: 'br-main', name: 'production', default: true },
          ],
        }),
      )
      // POST /branches → create
      .mockReturnValueOnce(
        okJson({
          branch: { id: 'br-test', name: 'test-12345' },
          operations: [{ id: 'op-1', status: 'scheduled' }],
        }),
      )
      // GET /operations/op-1 → finished
      .mockReturnValueOnce(okJson({ operation: { id: 'op-1', status: 'finished' } }))
      // GET /connection_uri pooled
      .mockReturnValueOnce(okJson({ uri: 'postgres://u:p@host-pooler.neon.tech/neondb' }))
      // GET /connection_uri direct
      .mockReturnValueOnce(okJson({ uri: 'postgres://u:p@host.neon.tech/neondb' }))

    const { setupNeonBranch } = await import('./neon-branch')
    const { pooledUrl, directUrl } = await setupNeonBranch()

    expect(pooledUrl).toBe('postgres://u:p@host-pooler.neon.tech/neondb')
    expect(directUrl).toBe('postgres://u:p@host.neon.tech/neondb')

    // Verify the create call shape
    const createCall = fetchMock.mock.calls[1]!
    expect(createCall[0]).toContain('/projects/fake-project/branches')
    const body = JSON.parse(createCall[1].body as string)
    expect(body.branch.name).toBe('test-12345')
    expect(body.branch.parent_id).toBe('br-main')
  })

  it('writes branchId to the cache file', async () => {
    fetchMock
      .mockReturnValueOnce(
        okJson({ branches: [{ id: 'br-main', name: 'production', default: true }] }),
      )
      .mockReturnValueOnce(
        okJson({
          branch: { id: 'br-cached', name: 'test-12345' },
          operations: [{ id: 'op-1', status: 'finished' }],
        }),
      )
      .mockReturnValueOnce(okJson({ operation: { id: 'op-1', status: 'finished' } }))
      .mockReturnValueOnce(okJson({ uri: 'postgres://pooled' }))
      .mockReturnValueOnce(okJson({ uri: 'postgres://direct' }))

    const { setupNeonBranch } = await import('./neon-branch')
    await setupNeonBranch()

    const written = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'))
    expect(written).toEqual({ branchId: 'br-cached' })
  })

  it('throws a descriptive error when NEON_API_KEY is missing', async () => {
    delete process.env.NEON_API_KEY
    const { setupNeonBranch } = await import('./neon-branch')
    await expect(setupNeonBranch()).rejects.toThrow(/NEON_API_KEY/)
  })

  it('throws when no default branch exists in the project', async () => {
    fetchMock.mockReturnValueOnce(
      okJson({ branches: [{ id: 'br-x', name: 'staging', default: false }] }),
    )
    const { setupNeonBranch } = await import('./neon-branch')
    await expect(setupNeonBranch()).rejects.toThrow(/default/i)
  })
})

describe('teardownNeonBranch', () => {
  it('reads the cache file and DELETEs the branch', async () => {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
    await fs.writeFile(CACHE_FILE, JSON.stringify({ branchId: 'br-to-delete' }))
    fetchMock.mockReturnValueOnce(okJson({}))

    const { teardownNeonBranch } = await import('./neon-branch')
    await teardownNeonBranch()

    const call = fetchMock.mock.calls[0]!
    expect(call[0]).toContain('/projects/fake-project/branches/br-to-delete')
    expect(call[1].method).toBe('DELETE')
  })

  it('swallows 404 (branch already gone)', async () => {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
    await fs.writeFile(CACHE_FILE, JSON.stringify({ branchId: 'br-gone' }))
    fetchMock.mockReturnValueOnce(errResponse(404, 'not found'))

    const { teardownNeonBranch } = await import('./neon-branch')
    await expect(teardownNeonBranch()).resolves.toBeUndefined()
  })

  it('is a no-op when the cache file is missing', async () => {
    const { teardownNeonBranch } = await import('./neon-branch')
    await expect(teardownNeonBranch()).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
