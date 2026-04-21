-- Add soft-delete tracking fields for documents
ALTER TABLE "Document" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Document" ADD COLUMN "deletedAt" DATETIME;

-- Query speed for active/deleted filtering
CREATE INDEX "Document_status_idx" ON "Document"("status");
