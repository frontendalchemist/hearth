import { execSync } from 'node:child_process'
import { setupNeonBranch, teardownNeonBranch } from './neon-branch'

export default async function globalSetup() {
  const { pooledUrl, directUrl } = await setupNeonBranch()
  process.env.DATABASE_URL = pooledUrl

  execSync('pnpm --filter @hearth/db db:migrate:deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: directUrl },
  })

  return async () => {
    await teardownNeonBranch()
  }
}
