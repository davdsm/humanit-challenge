-- Add soft-delete fields for clients
ALTER TABLE "Client" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Client" ADD COLUMN "deletedAt" DATETIME;

-- Query speed for active/deleted filtering
CREATE INDEX "Client_status_idx" ON "Client"("status");
