-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "description" TEXT,
    "expirationDate" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("clientId", "createdAt", "description", "expirationDate", "id", "mimeType", "originalName", "sizeBytes", "storageKey", "updatedAt") SELECT "clientId", "createdAt", "description", "expirationDate", "id", "mimeType", "originalName", "sizeBytes", "storageKey", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
