-- Redefine Document as file-backed metadata (drops legacy rows).
PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "Document";

CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "description" TEXT,
    "expirationDate" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");

CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

PRAGMA foreign_keys=ON;
