// Prints the executable Pothos schema to packages/shared/schema.graphql.
// The committed SDL file is the cross-package contract — clients (eventual
// mobile app, codegen consumers) read this rather than depend on a runtime
// GraphQL endpoint. CI verifies the committed file is in sync via
// `git diff --exit-code` after running this script.

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lexicographicSortSchema, printSchema } from 'graphql'
import { schema } from '../src/lib/graphql/schema'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'shared',
  'schema.graphql',
)

const sdl = printSchema(lexicographicSortSchema(schema)) + '\n'

mkdirSync(path.dirname(outPath), { recursive: true })
writeFileSync(outPath, sdl)

const relative = path.relative(process.cwd(), outPath)
console.log(`Wrote ${relative} (${sdl.length} bytes)`)
