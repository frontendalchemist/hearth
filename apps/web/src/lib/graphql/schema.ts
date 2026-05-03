import SchemaBuilder from '@pothos/core'

// Pothos schema scaffolding. Real types land in Sprint 1+ as features are
// built; for Phase 0 we keep a minimal schema so `pnpm graphql:codegen`
// always has something to print and the SDL contract is wired up before
// the first feature ships.

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const builder = new SchemaBuilder<{}>({})

builder.queryType({
  fields: (t) => ({
    serverHealth: t.boolean({
      description:
        'Liveness probe — always returns true. Placeholder until typed ' +
        'queries are added in Sprint 1.',
      resolve: () => true,
    }),
  }),
})

export const schema = builder.toSchema()
