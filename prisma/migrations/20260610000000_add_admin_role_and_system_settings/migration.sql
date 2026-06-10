-- Add role field to User table
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateTable SystemSettings (singleton)
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "updateCheckHour" INTEGER NOT NULL DEFAULT 3,
    "updateAvailable" BOOLEAN NOT NULL DEFAULT false,
    "latestVersion" TEXT,
    "lastChecked" DATETIME
);

-- Seed singleton row
INSERT OR IGNORE INTO "SystemSettings" ("id") VALUES ('singleton');
