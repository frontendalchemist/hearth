import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setupNeonBranch, teardownNeonBranch } from './neon-branch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load NEON_API_KEY / NEON_PROJECT_ID from a gitignored .env.test.local
// when present, so contributors don't have to re-export them every shell.
// Silently skipped on CI (where GitHub Secrets populate process.env directly)
// and any time the file doesn't exist.
function loadLocalEnvIfPresent() {
  const envFile = path.resolve(__dirname, '..', '.env.test.local')
  try {
    process.loadEnvFile(envFile)
  } catch {
    // file missing or unreadable — fall through to whatever's in process.env
  }
}

export default async function globalSetup() {
  loadLocalEnvIfPresent()

  const { pooledUrl, directUrl } = await setupNeonBranch()
  process.env.DATABASE_URL = pooledUrl

  // If migrate fails, Vitest does not run the teardown returned below,
  // so the branch leaks. Tear it down here before rethrowing.
  try {
    execSync('pnpm --filter @hearth/db db:migrate:deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: directUrl },
    })
  } catch (err) {
    await teardownNeonBranch().catch(() => {})
    throw err
  }

  return async () => {
    await teardownNeonBranch()
  }
}
