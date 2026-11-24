-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "LocationCategory" AS ENUM ('HOSPITAL', 'BANK', 'GOVERNMENT_OFFICE');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'SERVING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CrowdLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateTable users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable locations
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LocationCategory" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable service_counters
CREATE TABLE "service_counters" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "counterName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable queue_entries
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "locationId" TEXT NOT NULL,
    "serviceCounterId" TEXT,
    "tokenNumber" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable crowd_reports
CREATE TABLE "crowd_reports" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "crowdLevel" "CrowdLevel" NOT NULL,
    "peopleCount" INTEGER NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "crowd_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable wait_predictions
CREATE TABLE "wait_predictions" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "predictedMinutes" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wait_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "locations_category_idx" ON "locations"("category");
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "service_counters_locationId_idx" ON "service_counters"("locationId");
CREATE INDEX "service_counters_locationId_isActive_idx" ON "service_counters"("locationId", "isActive");

-- CreateIndex
CREATE INDEX "queue_entries_locationId_status_idx" ON "queue_entries"("locationId", "status");
CREATE INDEX "queue_entries_locationId_createdAt_idx" ON "queue_entries"("locationId", "createdAt");
CREATE INDEX "queue_entries_userId_idx" ON "queue_entries"("userId");
CREATE INDEX "queue_entries_tokenNumber_idx" ON "queue_entries"("tokenNumber");

-- CreateIndex
CREATE INDEX "crowd_reports_locationId_reportedAt_idx" ON "crowd_reports"("locationId", "reportedAt");

-- CreateIndex
CREATE INDEX "wait_predictions_locationId_createdAt_idx" ON "wait_predictions"("locationId", "createdAt");

-- AddForeignKey
ALTER TABLE "service_counters" ADD CONSTRAINT "service_counters_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_serviceCounterId_fkey" FOREIGN KEY ("serviceCounterId") REFERENCES "service_counters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crowd_reports" ADD CONSTRAINT "crowd_reports_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wait_predictions" ADD CONSTRAINT "wait_predictions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
