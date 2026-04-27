import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NEON_API = 'https://console.neon.tech/api/v2'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.resolve(__dirname, '..', 'node_modules', '.cache', 'neon-test-branch.json')

interface CreateBranchResponse {
  branch: { id: string; name: string }
  operations: Array<{ id: string; status: string }>
}

interface OperationResponse {
  operation: { id: string; status: string; error?: string }
}

interface BranchListResponse {
  branches: Array<{ id: string; name: string }>
}

interface ConnectionUriResponse {
  uri: string
}

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} environment variable is required`)
  return v
}

async function neonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = requiredEnv('NEON_API_KEY')
  const res = await fetch(`${NEON_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Neon API ${init?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`)
  }
  return (await res.json()) as T
}

async function findMainBranchId(projectId: string): Promise<string> {
  const data = await neonFetch<BranchListResponse>(`/projects/${projectId}/branches`)
  const main = data.branches.find((b) => b.name === 'main')
  if (!main) throw new Error('No main branch found in Neon project')
  return main.id
}

async function waitForOperation(projectId: string, opId: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const { operation } = await neonFetch<OperationResponse>(
      `/projects/${projectId}/operations/${opId}`,
    )
    if (operation.status === 'finished') return
    if (operation.status === 'failed') {
      throw new Error(`Neon operation ${opId} failed: ${operation.error ?? 'unknown'}`)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Neon operation ${opId} did not complete within 30s`)
}

async function getConnectionUri(
  projectId: string,
  branchId: string,
  pooled: boolean,
): Promise<string> {
  const params = new URLSearchParams({
    branch_id: branchId,
    database_name: 'neondb',
    role_name: 'neondb_owner',
    pooled: String(pooled),
  })
  const data = await neonFetch<ConnectionUriResponse>(
    `/projects/${projectId}/connection_uri?${params}`,
  )
  return data.uri
}

async function persistBranchId(branchId: string): Promise<void> {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify({ branchId }))
}

async function readPersistedBranchId(): Promise<string | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    const { branchId } = JSON.parse(raw) as { branchId: string }
    return branchId
  } catch {
    return null
  }
}

export async function setupNeonBranch(): Promise<{ pooledUrl: string; directUrl: string }> {
  const projectId = requiredEnv('NEON_PROJECT_ID')
  const parentId = await findMainBranchId(projectId)
  const name = `test-${process.env.GITHUB_RUN_ID ?? Date.now()}`

  const created = await neonFetch<CreateBranchResponse>(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: JSON.stringify({
      branch: { name, parent_id: parentId },
      endpoints: [{ type: 'read_write' }],
    }),
  })

  for (const op of created.operations) {
    await waitForOperation(projectId, op.id)
  }

  const branchId = created.branch.id
  const [pooledUrl, directUrl] = await Promise.all([
    getConnectionUri(projectId, branchId, true),
    getConnectionUri(projectId, branchId, false),
  ])

  await persistBranchId(branchId)
  return { pooledUrl, directUrl }
}

export async function teardownNeonBranch(): Promise<void> {
  const projectId = process.env.NEON_PROJECT_ID
  if (!projectId) return
  const branchId = await readPersistedBranchId()
  if (!branchId) return

  try {
    await neonFetch(`/projects/${projectId}/branches/${branchId}`, { method: 'DELETE' })
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes('404')) throw e
  } finally {
    await fs.unlink(CACHE_FILE).catch(() => {})
  }
}
