import { db, Role, DocumentCategory, DocumentStatus, MedicationFrequency, CareStage, TaskStatus, TaskPriority, AuditAction } from './index'

async function main() {
  console.log('Seeding database...')

  // Admin user (you)
  const admin = await db.user.upsert({
    where: { email: 'admin@hearth.dev' },
    update: {},
    create: {
      auth0Sub: 'auth0|seed-admin-001',
      email: 'admin@hearth.dev',
      name: 'Sarah Chen',
    },
  })

  // Care recipient
  const dorothy = await db.careRecipient.upsert({
    where: { id: 'seed-dorothy-001' },
    update: {},
    create: {
      id: 'seed-dorothy-001',
      firstName: 'Dorothy',
      lastName: 'Chen',
      dateOfBirth: new Date('1942-03-15'),
      careStage: CareStage.STAGE_2_SOME_HELP,
    },
  })

  // Membership
  await db.careRecipientMembership.upsert({
    where: {
      userId_careRecipientId: {
        userId: admin.id,
        careRecipientId: dorothy.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      careRecipientId: dorothy.id,
      role: Role.ADMIN,
    },
  })

  // Sample documents
  await db.document.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'seed-doc-001',
        careRecipientId: dorothy.id,
        uploadedById: admin.id,
        filename: 'power-of-attorney.pdf',
        s3Key: 'seed/power-of-attorney.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 204800,
        category: DocumentCategory.LEGAL,
        status: DocumentStatus.READY,
        tags: ['poa', 'legal'],
      },
      {
        id: 'seed-doc-002',
        careRecipientId: dorothy.id,
        uploadedById: admin.id,
        filename: 'medicare-card.jpg',
        s3Key: 'seed/medicare-card.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 51200,
        category: DocumentCategory.INSURANCE,
        status: DocumentStatus.READY,
        tags: ['medicare', 'insurance'],
      },
    ],
  })

  // Sample medications
  await db.medication.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'seed-med-001',
        careRecipientId: dorothy.id,
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: MedicationFrequency.DAILY,
        prescribedBy: 'Dr. Patricia Nguyen',
        refillDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'seed-med-002',
        careRecipientId: dorothy.id,
        name: 'Metformin',
        dosage: '500mg',
        frequency: MedicationFrequency.TWICE_DAILY,
        prescribedBy: 'Dr. Patricia Nguyen',
      },
    ],
  })

  // Sample provider
  await db.provider.upsert({
    where: { id: 'seed-provider-001' },
    update: {},
    create: {
      id: 'seed-provider-001',
      careRecipientId: dorothy.id,
      name: 'Dr. Patricia Nguyen',
      specialty: 'Internal Medicine',
      phone: '(555) 234-5678',
      isPrimary: true,
    },
  })

  // Sample task
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
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Consent record
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

  console.log('Seed complete.')
  console.log(`  User: ${admin.email}`)
  console.log(`  Care recipient: ${dorothy.firstName} ${dorothy.lastName}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
