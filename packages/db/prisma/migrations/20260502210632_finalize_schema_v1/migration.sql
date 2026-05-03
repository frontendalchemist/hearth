-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('ALL_MEMBERS', 'ADMIN_ONLY', 'SPECIFIC_MEMBERS');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('EMERGENCY_PACKET', 'DOCUMENT', 'CARE_SUMMARY');

-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('OVERDUE', 'DUE_THIS_YEAR', 'UPCOMING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WarningSignDomain" AS ENUM ('COGNITIVE', 'PHYSICAL', 'FUNCTIONAL', 'FINANCIAL', 'SOCIAL');

-- CreateEnum
CREATE TYPE "WarningUrgency" AS ENUM ('MONITOR', 'SEE_DOCTOR', 'ACT_NOW');

-- CreateEnum
CREATE TYPE "CareLogCategory" AS ENUM ('COGNITIVE', 'MEDICAL', 'PHYSICAL', 'NUTRITIONAL', 'SOCIAL', 'FINANCIAL', 'BEHAVIORAL', 'LEGAL_ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DOCUMENT_MISSING', 'DOCUMENT_EXPIRING', 'DOCUMENT_NEEDS_SIGNATURE', 'MEDICATION_LOW_REFILL', 'SCREENING_OVERDUE', 'DRUG_INTERACTION', 'TASK_OVERDUE', 'COVERAGE_EXPIRING', 'MEDICARE_OEP', 'STAGE_CHANGE_SUGGESTED', 'SHARE_LINK_ACCESSED', 'COLLABORATOR_JOINED', 'DOCUMENT_UPLOADED_BY_OTHER', 'FAMILY_MEETING_RECOMMENDED', 'SPECIALIST_RECOMMENDED');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum: rename MEMBER -> COORDINATOR.
-- The auto-generated diff also alters "Invitation".role here, but Invitation
-- doesn't exist yet at this point in the migration (created below) — so that
-- line is intentionally absent. Invitation is created with the renamed
-- enum already in place.
-- The CASE expression backfills any pre-existing 'MEMBER' rows to
-- 'COORDINATOR' so the cast never sees a value missing from the new enum.
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'COORDINATOR', 'VIEWER');
ALTER TABLE "CareRecipientMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "CareRecipientMembership" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE WHEN "role"::text = 'MEMBER' THEN 'COORDINATOR' ELSE "role"::text END::"Role_new"
);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "CareRecipientMembership" ALTER COLUMN "role" SET DEFAULT 'COORDINATOR';
COMMIT;

-- AlterEnum
ALTER TYPE "DocumentCategory" ADD VALUE 'CARE_PLANS';

-- DropForeignKey
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_documentId_fkey";

-- DropForeignKey
ALTER TABLE "AiConversation" DROP CONSTRAINT "AiConversation_careRecipientId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "ConsentRecord" DROP CONSTRAINT "ConsentRecord_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "CareRecipientMembership" ADD COLUMN     "relationship" TEXT,
ALTER COLUMN "role" SET DEFAULT 'COORDINATOR';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "customCategory" TEXT,
ADD COLUMN     "visibility" "DocumentVisibility" NOT NULL DEFAULT 'ALL_MEMBERS';

-- AlterTable
ALTER TABLE "ShareLink" DROP COLUMN "usedAt",
ADD COLUMN     "accessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "pin" TEXT,
ADD COLUMN     "resourceId" TEXT NOT NULL,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "type" "ShareType" NOT NULL,
ADD COLUMN     "viewLimit" INTEGER,
ALTER COLUMN "documentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fhirJson" JSONB,
ADD COLUMN     "isBeersCriteria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "organization" TEXT;

-- AlterTable
ALTER TABLE "Screening" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fhirJson" JSONB,
ADD COLUMN     "status" "ScreeningStatus" NOT NULL DEFAULT 'UPCOMING';

-- AlterTable
ALTER TABLE "AiConversation" ALTER COLUMN "careRecipientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CareLogEntry" ADD COLUMN     "category" "CareLogCategory",
ADD COLUMN     "customCategory" TEXT;

-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN     "revocationReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecipientLink" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRecipientLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPermissionMember" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DocumentPermissionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentContact" (
    "id" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentReminder" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "documentTag" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "channel" TEXT NOT NULL,

    CONSTRAINT "DocumentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationInteraction" (
    "id" TEXT NOT NULL,
    "medicationAId" TEXT NOT NULL,
    "medicationBId" TEXT NOT NULL,
    "severity" "InteractionSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "externalId" TEXT,
    "fhirJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" "InteractionSeverity",
    "externalId" TEXT,
    "fhirJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "providerId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "prepChecklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarningSignLog" (
    "id" TEXT NOT NULL,
    "careRecipientId" TEXT NOT NULL,
    "loggedById" TEXT NOT NULL,
    "domain" "WarningSignDomain" NOT NULL,
    "observation" TEXT NOT NULL,
    "urgency" "WarningUrgency" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WarningSignLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careRecipientId" TEXT,
    "state" TEXT,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgingPlanSection" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgingPlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvanceDirective" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "pdfS3Key" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvanceDirective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishesJournalEntry" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "prompt" TEXT,
    "content" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishesJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "careRecipientId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "priority" "AlertPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "actionUrl" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_status_idx" ON "Invitation"("email", "status");

-- CreateIndex
CREATE INDEX "Invitation_careRecipientId_status_idx" ON "Invitation"("careRecipientId", "status");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "DocumentRecipientLink_careRecipientId_idx" ON "DocumentRecipientLink"("careRecipientId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRecipientLink_documentId_careRecipientId_key" ON "DocumentRecipientLink"("documentId", "careRecipientId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPermissionMember_documentId_userId_key" ON "DocumentPermissionMember"("documentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationInteraction_medicationAId_medicationBId_key" ON "MedicationInteraction"("medicationAId", "medicationBId");

-- CreateIndex
CREATE INDEX "Appointment_careRecipientId_scheduledAt_idx" ON "Appointment"("careRecipientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "WarningSignLog_careRecipientId_domain_idx" ON "WarningSignLog"("careRecipientId", "domain");

-- CreateIndex
CREATE INDEX "WarningSignLog_careRecipientId_urgency_resolvedAt_idx" ON "WarningSignLog"("careRecipientId", "urgency", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgingPlan_userId_key" ON "AgingPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgingPlanSection_planId_sectionKey_key" ON "AgingPlanSection"("planId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdvanceDirective_planId_key" ON "AdvanceDirective"("planId");

-- CreateIndex
CREATE INDEX "Alert_userId_isDismissed_isRead_idx" ON "Alert"("userId", "isDismissed", "isRead");

-- CreateIndex
CREATE INDEX "Alert_careRecipientId_isDismissed_idx" ON "Alert"("careRecipientId", "isDismissed");

-- CreateIndex
CREATE INDEX "Alert_expiresAt_idx" ON "Alert"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_userId_type_resourceType_resourceId_key" ON "Alert"("userId", "type", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "Document_careRecipientId_category_idx" ON "Document"("careRecipientId", "category");

-- CreateIndex
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareLink_token_idx" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "Medication_careRecipientId_isActive_idx" ON "Medication"("careRecipientId", "isActive");

-- CreateIndex
CREATE INDEX "StageAssessment_careRecipientId_assessedAt_idx" ON "StageAssessment"("careRecipientId", "assessedAt");

-- CreateIndex
CREATE INDEX "Task_careRecipientId_status_idx" ON "Task"("careRecipientId", "status");

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "CareLogEntry_careRecipientId_createdAt_idx" ON "CareLogEntry"("careRecipientId", "createdAt");

-- CreateIndex
CREATE INDEX "CareLogEntry_careRecipientId_category_idx" ON "CareLogEntry"("careRecipientId", "category");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecipientLink" ADD CONSTRAINT "DocumentRecipientLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecipientLink" ADD CONSTRAINT "DocumentRecipientLink_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPermissionMember" ADD CONSTRAINT "DocumentPermissionMember_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPermissionMember" ADD CONSTRAINT "DocumentPermissionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentContact" ADD CONSTRAINT "DocumentContact_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReminder" ADD CONSTRAINT "DocumentReminder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "DocumentContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationInteraction" ADD CONSTRAINT "MedicationInteraction_medicationAId_fkey" FOREIGN KEY ("medicationAId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationInteraction" ADD CONSTRAINT "MedicationInteraction_medicationBId_fkey" FOREIGN KEY ("medicationBId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarningSignLog" ADD CONSTRAINT "WarningSignLog_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarningSignLog" ADD CONSTRAINT "WarningSignLog_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgingPlan" ADD CONSTRAINT "AgingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgingPlan" ADD CONSTRAINT "AgingPlan_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgingPlanSection" ADD CONSTRAINT "AgingPlanSection_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AgingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceDirective" ADD CONSTRAINT "AdvanceDirective_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AgingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishesJournalEntry" ADD CONSTRAINT "WishesJournalEntry_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AgingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_careRecipientId_fkey" FOREIGN KEY ("careRecipientId") REFERENCES "CareRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

