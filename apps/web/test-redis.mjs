import { Redis } from '@upstash/redis';

const r = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

await r.set('ping', 'pong');
const val = await r.get('ping');
console.log('Redis OK:', val);
await r.del('ping');
process.exit(0);
