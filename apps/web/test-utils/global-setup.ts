import { execSync } from 'node:child_process'
import { setupNeonBranch, teardownNeonBranch } from './neon-branch'

export default async function globalSetup() {
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
