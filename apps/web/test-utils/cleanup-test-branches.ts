import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NEON_API = 'https://console.neon.tech/api/v2'

interface BranchListResponse {
  branches: Array<{ id: string; name: string; default?: boolean; created_at: string }>
}

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} environment variable is required`)
  return v
}

async function neonFetch<T>(p: string, init?: RequestInit): Promise<T> {
  const apiKey = requiredEnv('NEON_API_KEY')
  const res = await fetch(`${NEON_API}${p}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(
      `Neon API ${init?.method ?? 'GET'} ${p} failed: ${res.status} ${await res.text()}`,
    )
  }
  return (await res.json()) as T
}

async function main() {
  try {
    process.loadEnvFile(path.resolve(__dirname, '..', '.env.test.local'))
  } catch {
    // .env.test.local is optional — fall through to whatever's in process.env
  }

  const dryRun = process.argv.includes('--dry-run')
  const projectId = requiredEnv('NEON_PROJECT_ID')
  const { branches } = await neonFetch<BranchListResponse>(`/projects/${projectId}/branches`)
  const targets = branches.filter((b) => b.name.startsWith('test-') && !b.default)

  if (targets.length === 0) {
    console.log('No orphaned test branches.')
    return
  }

  console.log(`${dryRun ? 'Would delete' : 'Deleting'} ${targets.length} test branch(es):`)
  for (const b of targets) {
    console.log(`  - ${b.name} (${b.id}, created ${b.created_at})`)
  }

  if (dryRun) return

  let failures = 0
  for (const b of targets) {
    try {
      await neonFetch(`/projects/${projectId}/branches/${b.id}`, { method: 'DELETE' })
    } catch (e) {
      failures++
      console.warn(`  failed to delete ${b.id}: ${e instanceof Error ? e.message : e}`)
    }
  }
  console.log(failures === 0 ? 'Done.' : `Done with ${failures} failure(s).`)
  if (failures > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
