import { Redis } from '@upstash/redis'

let client: Redis | null = null

/**
 * Lazy singleton for the Upstash Redis REST client. Constructed on first call
 * so missing env vars surface as a clear runtime error at the call site rather
 * than a silent crash at module load (and so tests can mock the module without
 * needing the env wired up).
 */
export function getRedis(): Redis {
  if (!client) {
    client = Redis.fromEnv()
  }
  return client
}
