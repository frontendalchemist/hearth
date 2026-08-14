import SchemaBuilder from '@pothos/core'
import { db, type CareStage } from '@hearth/db'
import type { AuthUser } from '@/lib/auth'
import { GraphQLError } from 'graphql'

export type GraphQLContext = {
  user: AuthUser | null
}

// Object shape we hand to Pothos for `CareRecipient`. The membership-scoped
// `relationship` is hoisted onto the parent so the resolver can return a
// flat shape — the field lives on `CareRecipientMembership` in Postgres.
type CareRecipientShape = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date | null
  careStage: CareStage
  photoUrl: string | null
  relationship: string | null
}

const builder = new SchemaBuilder<{
  Context: GraphQLContext
  Objects: {
    CareRecipient: CareRecipientShape
  }
  Scalars: {
    Date: { Input: Date; Output: Date }
  }
}>({})

builder.scalarType('Date', {
  description: 'ISO-8601 timestamp.',
  serialize: (value) =>
    value instanceof Date ? value.toISOString() : new Date(value).toISOString(),
  parseValue: (value) => {
    if (typeof value !== 'string') {
      throw new GraphQLError('Date scalar expects an ISO-8601 string')
    }
    return new Date(value)
  },
})

const CareStageEnum = builder.enumType('CareStage', {
  values: [
    'STAGE_1_INDEPENDENT',
    'STAGE_2_SOME_HELP',
    'STAGE_3_ASSISTED_LIVING',
    'STAGE_4_MEMORY_CARE',
    'STAGE_5_END_OF_LIFE',
  ] as const,
})

builder.objectType('CareRecipient', {
  description:
    "A person being cared for, scoped to the requesting caregiver's memberships.",
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    dateOfBirth: t.expose('dateOfBirth', { type: 'Date', nullable: true }),
    careStage: t.expose('careStage', { type: CareStageEnum }),
    photoUrl: t.exposeString('photoUrl', { nullable: true }),
    relationship: t.exposeString('relationship', {
      nullable: true,
      description:
        "How the requesting caregiver relates to this recipient (e.g. 'daughter'). Null when the membership doesn't carry a label.",
    }),
    age: t.int({
      nullable: true,
      description: 'Years between dateOfBirth and today, or null if DOB is unknown.',
      resolve: (parent) => (parent.dateOfBirth ? computeAge(parent.dateOfBirth) : null),
    }),
    activeAlertCount: t.int({
      description:
        "Count of the viewer's active (unread, not dismissed) alerts for this recipient.",
      resolve: async (parent, _args, ctx) => {
        if (!ctx.user) return 0
        return db.alert.count({
          where: {
            careRecipientId: parent.id,
            userId: ctx.user.id, // scope to the viewer — don't leak other members' alerts
            isDismissed: false,
            isRead: false,
          },
        })
      },
    }),
  }),
})

// Exported as a plain function so tests don't have to drive the schema
// through `graphql.execute()` — Pothos and graphql interop badly with
// vitest's module loader otherwise.
export async function careRecipientsResolver(
  ctx: GraphQLContext,
): Promise<CareRecipientShape[]> {
  if (!ctx.user) {
    throw new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHORIZED', http: { status: 401 } },
    })
  }

  const memberships = await db.careRecipientMembership.findMany({
    where: { userId: ctx.user.id },
    include: { careRecipient: true },
    orderBy: { createdAt: 'asc' },
  })

  // The soft-delete extension does not filter relation includes (a
  // Prisma extension limitation called out in CLAUDE.md), so we drop
  // memberships pointing at tombstoned recipients here.
  return memberships
    .filter((m) => m.careRecipient && m.careRecipient.deletedAt === null)
    .map((m) => ({
      id: m.careRecipient.id,
      firstName: m.careRecipient.firstName,
      lastName: m.careRecipient.lastName,
      dateOfBirth: m.careRecipient.dateOfBirth,
      careStage: m.careRecipient.careStage,
      photoUrl: m.careRecipient.photoUrl,
      relationship: m.relationship,
    }))
}

export async function careRecipientResolver(
  ctx: GraphQLContext,
  id: string,
): Promise<CareRecipientShape | null> {
  if (!ctx.user) {
    throw new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHORIZED', http: { status: 401 } },
    })
  }

  // Membership lookup is the auth check: a caregiver only sees recipients
  // they belong to. Returning null instead of a 403 keeps the surface area
  // small (the page renders a generic not-found state) and avoids leaking
  // existence of recipient IDs across tenants.
  const membership = await db.careRecipientMembership.findFirst({
    where: { userId: ctx.user.id, careRecipientId: id },
    include: { careRecipient: true },
  })

  if (!membership?.careRecipient || membership.careRecipient.deletedAt !== null) {
    return null
  }

  return {
    id: membership.careRecipient.id,
    firstName: membership.careRecipient.firstName,
    lastName: membership.careRecipient.lastName,
    dateOfBirth: membership.careRecipient.dateOfBirth,
    careStage: membership.careRecipient.careStage,
    photoUrl: membership.careRecipient.photoUrl,
    relationship: membership.relationship,
  }
}

builder.queryType({
  fields: (t) => ({
    careRecipients: t.field({
      type: ['CareRecipient'],
      description:
        'Care recipients the authenticated caregiver is a member of, soft-delete-filtered.',
      resolve: (_root, _args, ctx) => careRecipientsResolver(ctx),
    }),
    careRecipient: t.field({
      type: 'CareRecipient',
      nullable: true,
      args: { id: t.arg.id({ required: true }) },
      description:
        'A single care recipient by id, scoped to the requesting caregiver. Null when not a member or soft-deleted.',
      resolve: (_root, args, ctx) => careRecipientResolver(ctx, String(args.id)),
    }),
    serverHealth: t.boolean({
      description: 'Liveness probe. Always returns true.',
      resolve: () => true,
    }),
  }),
})

export const schema = builder.toSchema()

function computeAge(dob: Date): number {
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}
