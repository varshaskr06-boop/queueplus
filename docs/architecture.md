# QueuePulse AI Architecture Documentation

## Overview

QueuePulse AI is an intelligent queue management and wait-time forecasting system developed for high-volume customer service facilities (hospitals, banks, retail desks, civic offices). It decouples user interactions, business workflows, and real-time machine learning predictions into three dedicated tiers:

```
[ Frontend: React + Vite + Tailwind ]
       │                     │
       ▼ (REST / JSON)       ▼ (Direct Model Queries)
[ Backend: Node.js Express ] ──► [ ML Service: FastAPI + Random Forest ]
       │
       ▼ (Prisma ORM)
[ PostgreSQL Database ]
```

---

## 1. Frontend Tier (`/frontend`)
- **Framework**: React 18, Vite 6
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Architecture**:
  - `src/components/`: Reusable UI cards, header, indicators.
  - `src/layouts/`: Common app shell and responsive navigation wrapper.
  - `src/pages/`: Operational dashboards, queue monitors, counter views.
  - `src/services/`: Centralized Axios instances for Backend and ML APIs.
  - `src/hooks/`: React custom hooks (e.g., `useHealthCheck`).

---

## 2. Backend Tier (`/backend`)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Key Models**:
  - `Queue`: Represents service branches/desks.
  - `Ticket`: Tracks customer waiting/serving/completed lifecycles.
  - `Prediction`: Caches model predictions, inputs, and confidence intervals.
- **Health Check**: `GET /api/health`

---

## 3. ML Service Tier (`/ml-service`)
- **Framework**: FastAPI + Uvicorn
- **Engine**: Scikit-Learn `RandomForestRegressor`
- **Features Used**:
  - `queue_length`: Total customers waiting.
  - `active_counters`: Active service desks.
  - `service_rate`: Historical customers processed/hour.
  - `arrival_rate`: Rate of inbound arrivals/hour.
  - `hour_of_day`: Circadian peak-hour indicator (8-20).
  - `day_of_week`: Weekday vs. weekend dynamics.
- **Artifact**: `models/queue_wait_time_rf.joblib`
- **Endpoints**:
  - `GET /health`
  - `GET /model-info`
  - `POST /predict`
