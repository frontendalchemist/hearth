// Seed script — populates a fresh database with realistic fake data for local
// development. Uses `dbUnsafe` to bypass the soft-delete and audit-log
// extensions: seeds should be idempotent and re-runnable, and we want
// deterministic AuditLog rows rather than ones implicitly written by the
// extension every time we re-run.

import { faker } from '@faker-js/faker'
import {
  AuditAction,
  CareLogCategory,
  CareStage,
  DocumentCategory,
  DocumentStatus,
  DocumentVisibility,
  MedicationFrequency,
  Role,
  ScreeningStatus,
  TaskPriority,
  TaskStatus,
  dbUnsafe as db,
} from './index'

// Stable randomness across runs makes diffs / debugging predictable.
faker.seed(20260502)

const ADMIN_EMAIL = 'admin@hearth.dev'
const RECIPIENT_ID = 'seed-dorothy-001'
const ADMIN_ID = 'seed-admin-001'

async function main() {
  console.log('Seeding database...')

  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      id: ADMIN_ID,
      auth0Sub: 'auth0|seed-admin-001',
      email: ADMIN_EMAIL,
      name: 'Sarah Chen',
      locale: 'en',
      state: 'OR',
      location: 'Portland, OR',
    },
  })

  const dorothy = await db.careRecipient.upsert({
    where: { id: RECIPIENT_ID },
    update: {},
    create: {
      id: RECIPIENT_ID,
      firstName: 'Dorothy',
      lastName: 'Chen',
      dateOfBirth: new Date('1942-03-15'),
      careStage: CareStage.STAGE_2_SOME_HELP,
    },
  })

  await db.careRecipientMembership.upsert({
    where: {
      userId_careRecipientId: { userId: admin.id, careRecipientId: dorothy.id },
    },
    update: {},
    create: {
      userId: admin.id,
      careRecipientId: dorothy.id,
      role: Role.ADMIN,
      relationship: 'daughter',
    },
  })

  // 5 documents across categories.
  const docFixtures: Array<{
    id: string
    filename: string
    category: DocumentCategory
    mimeType: string
    sizeBytes: number
    tags: string[]
  }> = [
    {
      id: 'seed-doc-001',
      filename: 'power-of-attorney.pdf',
      category: DocumentCategory.LEGAL,
      mimeType: 'application/pdf',
      sizeBytes: 204800,
      tags: ['poa', 'legal'],
    },
    {
      id: 'seed-doc-002',
      filename: 'medicare-card.jpg',
      category: DocumentCategory.INSURANCE,
      mimeType: 'image/jpeg',
      sizeBytes: 51200,
      tags: ['medicare', 'insurance'],
    },
    {
      id: 'seed-doc-003',
      filename: 'advance-directive.pdf',
      category: DocumentCategory.LEGAL,
      mimeType: 'application/pdf',
      sizeBytes: 156000,
      tags: ['advance-directive'],
    },
    {
      id: 'seed-doc-004',
      filename: 'recent-labs-2026-04.pdf',
      category: DocumentCategory.MEDICAL,
      mimeType: 'application/pdf',
      sizeBytes: 320000,
      tags: ['labs', 'q2-2026'],
    },
    {
      id: 'seed-doc-005',
      filename: 'long-term-care-plan.pdf',
      category: DocumentCategory.CARE_PLANS,
      mimeType: 'application/pdf',
      sizeBytes: 412000,
      tags: ['ltc', 'care-plan'],
    },
  ]

  for (const doc of docFixtures) {
    await db.document.upsert({
      where: { id: doc.id },
      update: {},
      create: {
        ...doc,
        careRecipientId: dorothy.id,
        uploadedById: admin.id,
        s3Key: `seed/${doc.filename}`,
        status: DocumentStatus.READY,
        visibility: DocumentVisibility.ALL_MEMBERS,
      },
    })
  }

  // 3 medications.
  const medFixtures: Array<{
    id: string
    name: string
    dosage: string
    frequency: MedicationFrequency
    isBeersCriteria?: boolean
  }> = [
    {
      id: 'seed-med-001',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: MedicationFrequency.DAILY,
    },
    {
      id: 'seed-med-002',
      name: 'Metformin',
      dosage: '500mg',
      frequency: MedicationFrequency.TWICE_DAILY,
    },
    {
      id: 'seed-med-003',
      name: 'Diphenhydramine',
      dosage: '25mg',
      frequency: MedicationFrequency.AS_NEEDED,
      isBeersCriteria: true,
    },
  ]

  for (const med of medFixtures) {
    await db.medication.upsert({
      where: { id: med.id },
      update: {},
      create: {
        ...med,
        careRecipientId: dorothy.id,
        prescribedBy: 'Dr. Patricia Nguyen',
        refillDate: faker.date.soon({ days: 21 }),
      },
    })
  }

  // 2 providers — one primary, one specialist.
  await db.provider.upsert({
    where: { id: 'seed-provider-001' },
    update: {},
    create: {
      id: 'seed-provider-001',
      careRecipientId: dorothy.id,
      name: 'Dr. Patricia Nguyen',
      specialty: 'Internal Medicine',
      phone: '(555) 234-5678',
      organization: 'Cascade Family Medicine',
      isPrimary: true,
    },
  })
  await db.provider.upsert({
    where: { id: 'seed-provider-002' },
    update: {},
    create: {
      id: 'seed-provider-002',
      careRecipientId: dorothy.id,
      name: 'Dr. Marcus Hill',
      specialty: 'Cardiology',
      phone: '(555) 345-6789',
      organization: 'Riverbend Heart Clinic',
    },
  })

  await db.task.upsert({
    where: { id: 'seed-task-001' },
    update: {},
    create: {
      id: 'seed-task-001',
      careRecipientId: dorothy.id,
      createdById: admin.id,
      title: 'Schedule annual physical',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: faker.date.soon({ days: 7 }),
    },
  })

  await db.careLogEntry.create({
    data: {
      careRecipientId: dorothy.id,
      authorId: admin.id,
      content: 'Mom mentioned she had trouble sleeping last night. Will mention at next visit.',
      category: CareLogCategory.BEHAVIORAL,
    },
  })

  await db.screening.upsert({
    where: { id: 'seed-screening-001' },
    update: {},
    create: {
      id: 'seed-screening-001',
      careRecipientId: dorothy.id,
      name: 'Annual mammogram',
      lastDate: new Date('2025-06-10'),
      nextDueDate: new Date('2026-06-10'),
      status: ScreeningStatus.UPCOMING,
    },
  })

  await db.consentRecord.upsert({
    where: {
      userId_consentType_version: {
        userId: admin.id,
        consentType: 'terms_of_service',
        version: '1.0',
      },
    },
    update: {},
    create: {
      userId: admin.id,
      consentType: 'terms_of_service',
      version: '1.0',
    },
  })

  // 10 audit log entries — explicit, deterministic. The extension would also
  // write these on every re-run; we use dbUnsafe here so the seed is
  // idempotent and the ledger doesn't grow with each run.
  await db.auditLog.deleteMany({ where: { metadata: { path: ['seed'], equals: true } } })
  await db.auditLog.createMany({
    data: [
      ...docFixtures.map((doc) => ({
        userId: admin.id,
        action: AuditAction.CREATE,
        resourceType: 'Document',
        resourceId: doc.id,
        metadata: { seed: true, operation: 'upload', filename: doc.filename },
      })),
      ...medFixtures.map((med) => ({
        userId: admin.id,
        action: AuditAction.CREATE,
        resourceType: 'Medication',
        resourceId: med.id,
        metadata: { seed: true, operation: 'add', name: med.name },
      })),
      {
        userId: admin.id,
        action: AuditAction.READ,
        resourceType: 'Document',
        resourceId: 'seed-doc-001',
        metadata: { seed: true, operation: 'view' },
      },
      {
        userId: admin.id,
        action: AuditAction.DOWNLOAD,
        resourceType: 'Document',
        resourceId: 'seed-doc-002',
        metadata: { seed: true, operation: 'download' },
      },
    ],
  })

  console.log('Seed complete.')
  console.log(`  User:           ${admin.email}`)
  console.log(`  Care recipient: ${dorothy.firstName} ${dorothy.lastName}`)
  console.log(`  Documents:      ${docFixtures.length}`)
  console.log(`  Medications:    ${medFixtures.length}`)
  console.log(`  Providers:      2`)
  console.log(`  Audit log:      ${docFixtures.length + medFixtures.length + 2}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
