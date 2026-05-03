-- Marks a User as anonymized via CCPA right-to-erasure. PII fields are
-- scrambled in place at erasure time; the row itself stays so child rows
-- (Document.uploadedById, AuditLog.userId, etc.) keep stable references.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
