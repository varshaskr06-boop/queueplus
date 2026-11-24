# QueuePulse AI ⏱️⚡

QueuePulse AI is an intelligent queue management and wait-time forecasting system built for hackathons and high-throughput public/private service facilities. It combines real-time queue ingestion, PostgreSQL with **Prisma ORM**, and a Scikit-learn **Random Forest Regressor** to forecast customer wait times, optimize counter allocations, and mitigate bottlenecks.

---

## Complete Authentication System

The application features full-stack authentication and Role-Based Access Control (RBAC):

### 1. Supported Roles & Permissions
- **`USER` (Citizen / Customer)**:
  - Search public locations (`/locations`) across Hospitals, Banks, and Government offices.
  - View real-time crowd information and Random Forest wait-time predictions.
  - Join facility queues and receive digital queue tickets (`/queues/join`).
  - View profile & active ticket history (`/profile`).
  - Cancel personal tickets (cannot mark tickets as `SERVING` or `COMPLETED`).
  - Submit live crowd reports (`/reports`).
- **`ADMIN` (System Administrator)**:
  - Access Admin Console (`/admin`).
  - View system analytics (user counts, queue states, counter utilization).
  - Register new public facilities & counters in atomic database transactions (`/admin/locations`).
  - Toggle and manage service counters on/off dynamically (`/admin/counters/:id`).
  - Advance and manage all queue records.

### 2. Demo Credentials (One-Click Available on `/login`)
| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Citizen User** | `jordan.miller@demo.local` | `QueuePulse2026!` | Public directory, Queues, Crowd reports, Profile |
| **Administrator** | `admin@queuepulse.demo` | `QueuePulse2026!` | Admin console, Facility creation, Counter toggles, Full analytics |

---

## Project Structure

```
QueuePulse-AI/
├── frontend/             # React 18 + Vite + Tailwind CSS Client
│   ├── src/
│   │   ├── components/   # Header, StatusCard, ProtectedRoute, AdminRoute
│   │   ├── context/      # AuthContext (JWT storage, login, register, logout)
│   │   ├── pages/        # Dashboard, Login, Register, Profile, UserPortal, AdminDashboard
│   │   ├── layouts/      # MainLayout wrapper
│   │   ├── services/     # Axios client with JWT request/response interceptors
│   │   ├── hooks/        # useHealthCheck
│   │   └── assets/       # Static icons & vectors
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/              # Node.js + Express API Server
│   ├── src/
│   │   ├── controllers/  # Auth, locations, queues, reports, predictions, admin
│   │   ├── routes/       # Express route handlers with rate limiters
│   │   ├── middleware/   # JWT auth, RBAC requireRole, Zod validateBody, error handling
│   │   ├── services/     # Bcrypt hashing, Prisma queries, ML bridge
│   │   ├── validators/   # Zod input validation schemas
│   │   ├── utils/        # Distance Haversine formula, JWT tokens
│   │   └── scripts/      # Endpoint test suite & DB connectivity test
│   ├── prisma/
│   │   ├── schema.prisma # PostgreSQL models (User, Location, ServiceCounter, QueueEntry, CrowdReport, WaitPrediction)
│   │   ├── migrations/   # SQL migrations
│   │   └── seed.js       # Database seeder (16 demonstration facilities)
│   └── package.json
│
├── ml-service/           # FastAPI Machine Learning Service
│   ├── app/
│   │   ├── main.py       # FastAPI application & endpoints
│   │   └── schemas.py    # Pydantic request/response schemas
│   ├── dataset/          # Synthetic dataset generator & CSVs
│   ├── models/           # Serialized Random Forest model (.joblib)
│   ├── train.py          # Model training & evaluation pipeline
│   └── requirements.txt  # Python ML dependencies
│
├── docs/                 # Architecture, Database & API specifications
│   ├── architecture.md
│   ├── database.md
│   └── api-specs.md
├── docker-compose.yml    # PostgreSQL 16 local container configuration
├── .env.example          # Root environment reference
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## Quick Start Guide

### 1. Database Setup (PostgreSQL)

#### Option A: Docker Compose (1 Command)
```bash
docker compose up -d
```

#### Option B: Local / Cloud PostgreSQL
Set `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/queuepulse_db?schema=public"
```

#### Apply Migrations & Seed Demo Data
```bash
cd backend
npm run prisma:deploy
npm run prisma:seed
npm run db:test
```

---

### 2. Service-by-Service Startup

#### A. Backend Service (Port 5000)
```bash
cd backend
npm test         # Run 30-case integration test suite
npm run dev      # Start Express API server
```
- API Base: [http://localhost:5000/api](http://localhost:5000/api)
- Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

#### B. ML Service (Port 8000)
```bash
cd ml-service
# Activate virtual environment
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux

# Train model (optional, pre-trained model already packaged)
python train.py

# Start FastAPI prediction server
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Test Suite: `python test_prediction_engine.py`

#### C. Frontend Client (Port 5173)
```bash
cd frontend
npm run build    # Verify production compilation
npm run dev      # Start React Vite development server
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## Complete 11 Frontend Pages & Navigation

| Route | Guard | Description |
|---|---|---|
| `/` | Public | Premium Landing Page with quick facility search and telemetry KPI counters |
| `/login` | Public | User & Admin Sign In with 1-click Demo credential autofill |
| `/register` | Public | Citizen registration with input validation and instant JWT issuance |
| `/dashboard` | Public / User | Personalized user dashboard with crowd trends and recommended visit slots |
| `/locations` | Public | Search 16 Public Facilities, filter by category/GPS, and view live waits |
| `/locations/:id` | Public | Detailed facility profile, interactive turnstiles, and 1-click ticket booking |
| `/predictions` | Public / User | AI Forecaster, What-If capacity simulator, and smart departure optimizer |
| `/map` | Public | Interactive Leaflet OpenStreetMap with custom pulsing pins and facility popups |
| `/report` | Public / User | Citizen crowd reporting with trust badges, conflict smoothing & freshness rules |
| `/profile` | `ProtectedRoute` | Authenticated citizen profile, active queue tickets, and self-cancellation |
| `/admin` | `AdminRoute` | Administrative Mission Control with Recharts charts, counter controls, and report auditing |

---

## Reliable Local Demonstration Mode

QueuePulse AI includes a **zero-dependency resilient demonstration mode** designed specifically for live hackathon pitches:
- **Automatic Fallback Store**: If a local PostgreSQL instance is not running on port 5432 or network drops during a stage pitch, the backend automatically serves seeded mock locations, queues, and predictions without crashing or returning unhandled 500 errors.
- **Pre-loaded Credentials**:
  - **Citizen Account**: `jordan.miller@demo.local` / `QueuePulse2026!`
  - **Administrator Account**: `admin@queuepulse.demo` / `QueuePulse2026!`
- **ML Baseline Resilience**: If the Python ML service is paused or undergoing redeployment, the backend switches automatically to a deterministic queuing-theory formula ($\text{Wait} = \frac{\text{Queue}}{\text{Counters} \times \mu} \times \text{PeakFactor}$).

---

## Production Deployment Guide

### 1. Frontend Deployment to Vercel
1. Push code to GitHub repository.
2. In Vercel Dashboard, import the repository.
3. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variables:
   - `VITE_API_BASE_URL`: `https://queuepulse-backend.onrender.com`
   - `VITE_ML_SERVICE_URL`: `https://queuepulse-ml.onrender.com`
5. Deploy. Vercel automatically applies `frontend/vercel.json` for client-side routing.

### 2. Backend & ML Service Deployment to Render
QueuePulse AI includes a native `render.yaml` blueprint:
1. In Render Dashboard, click **New +** $\to$ **Blueprint**.
2. Connect your GitHub repository.
3. Render automatically provisions:
   - `queuepulse-postgres`: Managed PostgreSQL instance.
   - `queuepulse-backend`: Express Web Service with automatic Prisma generation.
   - `queuepulse-ml`: Python FastAPI Web Service with automated training.
4. Set the `CORS_ORIGIN` environment variable on `queuepulse-backend` to your Vercel production URL.

### 3. PostgreSQL Database Migrations in Production
To apply migrations against a cloud PostgreSQL instance (Neon, Supabase, Render, AWS):
```bash
cd backend
# 1. Export production connection URL
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# 2. Deploy all pending Prisma migrations
npx prisma migrate deploy

# 3. Seed demo data into production database
npm run prisma:seed

# 4. (Optional) Open graphical database explorer
npx prisma studio
```

---

## Final Hackathon Demonstration Checklist

Use this step-by-step checklist during judging and stage demos:

- [ ] **1. Landing Page Presentation**:
  - Open `http://localhost:5173`.
  - Highlight real-time KPI telemetry (Hospitals, Banks, Government Offices, Wait Times).
  - Search for a facility by name (e.g. "General Hospital").
- [ ] **2. Citizen User Journey**:
  - Navigate to `/login` and click **"Demo Citizen"** to auto-populate credentials.
  - Sign in and arrive at `/dashboard`.
  - Open `/locations`, toggle category filters (Hospitals, Banks, Civic Hubs), and view estimated wait times.
  - Click into a facility profile (`/locations/:id`).
  - Click **"Get Queue Ticket"** to generate a digital token number (`HOSP-XXX`).
  - Open `/profile` to view active queue status and test citizen self-cancellation.
- [ ] **3. AI Forecasting & Recommendations**:
  - Navigate to `/predictions`.
  - Select travel duration (e.g. 25 min) and highlight the **Smart Departure Recommendation**.
  - Show the 24-hour hourly wait time trend chart and least-congested visit slots.
  - Adjust sliders in the **What-If Capacity Simulator** to demonstrate how opening extra counters dampens queue depth.
- [ ] **4. Interactive Leaflet Map**:
  - Navigate to `/map`.
  - Show pulsing markers color-coded by congestion level (Green = Low, Amber = Moderate, Red = High).
  - Click a marker to open popup with queue depth and wait forecast.
- [ ] **5. Community Crowd Reporting**:
  - Navigate to `/report`.
  - Submit a crowd report with people headcount.
  - Highlight time-decay weighted crowd calculation and suspicious report filtering.
- [ ] **6. Administrator Mission Control**:
  - Log out and sign in as **"Demo Administrator"** (`admin@queuepulse.demo`).
  - Open `/admin` to reveal the 5 management tabs:
    - **Analytics**: Recharts BarChart (Busy Hours), PieChart (Crowd Levels), AreaChart (7-Day Trends).
    - **Live Queue & Tickets**: Click **"Call to Desk"** $\to$ ticket transitions to `SERVING`; click **"Mark Done"** $\to$ ticket completes.
    - **Facilities & Desks**: Toggle a service counter `ACTIVE` $\leftrightarrow$ `OFFLINE` or add a new counter.
    - **Review Crowd Reports**: Review citizen reports and test **"Flag as Suspicious"**.
    - **Prediction Audit**: Review the AI inference audit trail.

---

## License
MIT

