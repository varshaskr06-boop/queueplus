# QueuePulse AI - Database Design & Setup Guide

## 1. Schema Overview

The database design provides a relational foundation for real-time queueing, counter dispatching, crowd verification, and predictive wait-time forecasting:

```
[ User ] ───────────────┐
   │ (1:N)              ▼ (1:N)
   └──────────────► [ QueueEntry ] ◄────────── [ ServiceCounter ]
                         ▲                           ▲
                         │ (1:N)                     │ (1:N)
                         └──────── [ Location ] ─────┘
                                      │       │
                                (1:N) │       │ (1:N)
                                      ▼       ▼
                       [ CrowdReport ]   [ WaitPrediction ]
```

---

## 2. Models Specification

### 1. `User` (`users`)
- **Fields**: `id` (UUID PK), `name`, `email` (Unique), `passwordHash`, `role` (`ADMIN`, `STAFF`, `USER`), `createdAt`.
- **Indexes**: `email` (unique index), `role`.

### 2. `Location` (`locations`)
- **Fields**: `id` (UUID PK), `name`, `category` (`HOSPITAL`, `BANK`, `GOVERNMENT_OFFICE`), `address`, `latitude`, `longitude`, `openingTime`, `closingTime`, `createdAt`.
- **Indexes**: `category`, `[latitude, longitude]`.

### 3. `ServiceCounter` (`service_counters`)
- **Fields**: `id` (UUID PK), `locationId` (FK -> `Location`), `counterName`, `isActive` (Boolean).
- **Cascade**: Deleting a location cascades and removes all its counters.
- **Indexes**: `locationId`, `[locationId, isActive]`.

### 4. `QueueEntry` (`queue_entries`)
- **Fields**: `id` (UUID PK), `userId` (FK -> `User`, nullable), `locationId` (FK -> `Location`), `serviceCounterId` (FK -> `ServiceCounter`, nullable), `tokenNumber`, `status` (`WAITING`, `SERVING`, `COMPLETED`, `CANCELLED`), `createdAt`, `startedAt`, `completedAt`.
- **Indexes**: `[locationId, status]`, `[locationId, createdAt]`, `userId`, `tokenNumber`.

### 5. `CrowdReport` (`crowd_reports`)
- **Fields**: `id` (UUID PK), `locationId` (FK -> `Location`), `crowdLevel` (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), `peopleCount` (Int), `reportedAt`, `verified` (Boolean).
- **Indexes**: `[locationId, reportedAt]`.

### 6. `WaitPrediction` (`wait_predictions`)
- **Fields**: `id` (UUID PK), `locationId` (FK -> `Location`), `predictedMinutes` (Float), `confidenceLevel` (Float), `createdAt`.
- **Indexes**: `[locationId, createdAt]`.

---

## 3. PostgreSQL Setup Options

### Option A: Using Docker Compose (Recommended - Zero Installation)
1. Ensure Docker Desktop is running.
2. In the project root folder:
   ```bash
   docker compose up -d
   ```
3. This boots PostgreSQL 16 on port 5432 with database `queuepulse_db`.

### Option B: Local Windows PostgreSQL Installation
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/).
2. During setup, set password as `postgres` (or your preferred password).
3. Open `pgAdmin` or `psql` and create the database:
   ```sql
   CREATE DATABASE queuepulse_db;
   ```
4. Verify `DATABASE_URL` in `backend/.env`.

### Option C: Cloud PostgreSQL (Neon / Supabase / Railway)
1. Create a free PostgreSQL database on [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Paste the provided direct connection string into `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-sample-pool.us-east-2.aws.neon.tech/queuepulse_db?sslmode=require"
   ```

---

## 4. Running Migrations & Seeding

From the `backend` directory:

```bash
# 1. Apply database migrations
npm run prisma:deploy
# or interactively for development:
npm run prisma:migrate

# 2. Seed 16 demonstration facilities, counters, and queues
npm run prisma:seed

# 3. Test connectivity and check table statistics
npm run db:test
```
