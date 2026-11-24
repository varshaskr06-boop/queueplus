# QueuePulse AI - REST API Specifications

The QueuePulse AI backend API is built on **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

Base URL: `http://localhost:5000/api`

---

## Authentication & Headers

Protected routes require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```

### Roles Supported:
- `USER`: Regular citizens / queue customers.
- `STAFF`: Triage staff, hospital nurses, bank tellers, DMV agents.
- `ADMIN`: System administrators.

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account and returns a signed JWT.
- **Rate Limit**: 20 requests / 15 minutes.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!",
    "role": "USER"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "e8e50bc5-64b4-4b53-a558-f9958cf3a778",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "USER",
      "createdAt": "2026-11-23T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

### `POST /api/auth/login`
Authenticates user credentials and returns a JWT.
- **Request Body**:
  ```json
  {
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "e8e50bc5-64b4-4b53-a558-f9958cf3a778",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

### `GET /api/auth/profile` *(Protected)*
Returns the authenticated user's profile and active queue tickets.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "e8e50bc5-64b4-4b53-a558-f9958cf3a778",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "USER",
      "queueEntries": []
    }
  }
  ```

---

## 2. Location Endpoints (`/api/locations`)

### `GET /api/locations`
Lists facilities with waiting counts and active counter counts.
- **Query Params**:
  - `category` (optional): `HOSPITAL`, `BANK`, `GOVERNMENT_OFFICE`
  - `search` (optional): Name or address substring
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)
- **Response (200 OK)**:
  ```json
  {
    "locations": [
      {
        "id": "c138cfec-1e28-40ff-9426-ff7d12f46210",
        "name": "Metro Central General Hospital (Demo Facility)",
        "category": "HOSPITAL",
        "address": "100 Health Sciences Blvd",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "openingTime": "00:00",
        "closingTime": "23:59",
        "waitingQueueCount": 14,
        "activeCounterCount": 4
      }
    ],
    "pagination": { "total": 16, "page": 1, "limit": 20, "totalPages": 1 }
  }
  ```

### `GET /api/locations/:id`
Retrieves location details, active counters, and current prediction.
- **Response (200 OK)**:
  ```json
  {
    "location": {
      "id": "c138cfec-1e28-40ff-9426-ff7d12f46210",
      "name": "Metro Central General Hospital (Demo Facility)",
      "category": "HOSPITAL",
      "serviceCounters": [
        { "id": "...", "counterName": "Triage Desk 1", "isActive": true }
      ],
      "currentWaitingCount": 14,
      "latestPrediction": {
        "predictedMinutes": 24.5,
        "confidenceLevel": 0.94
      }
    }
  }
  ```

### `GET /api/locations/nearby`
Calculates distance via the Haversine formula and returns closest facilities.
- **Query Params**:
  - `lat` (required): User's latitude
  - `lng` (required): User's longitude
  - `radius` (optional, default: 15 km)
- **Response (200 OK)**:
  ```json
  {
    "count": 5,
    "origin": { "lat": 37.7749, "lng": -122.4194, "radiusKm": 10 },
    "locations": [
      {
        "id": "c138cfec-1e28-40ff-9426-ff7d12f46210",
        "name": "Metro Central General Hospital (Demo Facility)",
        "distanceKm": 0.82,
        "waitingQueueCount": 14,
        "activeCounterCount": 4
      }
    ]
  }
  ```

---

## 3. Queue Operations (`/api/queues`)

### `GET /api/queues/:locationId`
Returns live waiting and serving tickets for a facility.
- **Response (200 OK)**:
  ```json
  {
    "location": { "id": "...", "name": "Metro Central General Hospital" },
    "stats": {
      "waitingCount": 14,
      "servingCount": 3,
      "activeCounters": 4,
      "estimatedAverageWaitMinutes": 28
    },
    "activeQueues": {
      "serving": [],
      "waiting": []
    }
  }
  ```

### `POST /api/queues/join`
Enters the user into the queue and generates an official token.
- **Request Body**:
  ```json
  {
    "locationId": "c138cfec-1e28-40ff-9426-ff7d12f46210",
    "serviceCounterId": "optional-counter-uuid"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Joined queue successfully",
    "queueEntry": {
      "id": "890f9d92-124b-449e-b230-f5a1ef4c5fbc",
      "tokenNumber": "HOSP-015",
      "status": "WAITING",
      "createdAt": "2026-11-23T12:05:00.000Z"
    },
    "positionInQueue": 15,
    "estimatedWaitMinutes": 32
  }
  ```

### `PATCH /api/queues/:id/status` *(Protected)*
Updates queue status (`WAITING`, `SERVING`, `COMPLETED`, `CANCELLED`).
> [!IMPORTANT]
> **Security Policy**: Regular users (`USER`) can only cancel their own tickets (`CANCELLED`). Any attempt by a `USER` to set status to `SERVING` or `COMPLETED` returns **`403 Forbidden`**. Only `STAFF` and `ADMIN` can advance tickets to `SERVING` or `COMPLETED`.
- **Request Body**:
  ```json
  {
    "status": "SERVING",
    "serviceCounterId": "optional-counter-uuid"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Queue status updated to SERVING",
    "queueEntry": {
      "id": "890f9d92-124b-449e-b230-f5a1ef4c5fbc",
      "status": "SERVING",
      "startedAt": "2026-11-23T12:15:00.000Z"
    }
  }
  ```

---

## 4. Crowd Reports (`/api/reports`)

### `POST /api/reports`
Submits real-time crowdsourced congestion observations.
- **Request Body**:
  ```json
  {
    "locationId": "c138cfec-1e28-40ff-9426-ff7d12f46210",
    "crowdLevel": "HIGH",
    "peopleCount": 42
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Crowd report submitted successfully",
    "report": {
      "id": "...",
      "crowdLevel": "HIGH",
      "peopleCount": 42,
      "verified": false,
      "reportedAt": "2026-11-23T12:10:00.000Z"
    }
  }
  ```

### `GET /api/reports/:locationId`
Returns recent reports and consensus crowd level.
- **Response (200 OK)**:
  ```json
  {
    "locationId": "...",
    "consensusCrowdLevel": "HIGH",
    "averagePeopleCount": 38,
    "totalReports": 5,
    "recentReports": []
  }
  ```

---

## 5. Predictions (`/api/predictions`)

### `GET /api/predictions/:locationId`
Returns the latest Random Forest wait-time forecast.
- **Response (200 OK)**:
  ```json
  {
    "prediction": {
      "id": "...",
      "predictedMinutes": 26.4,
      "confidenceLevel": 0.95,
      "createdAt": "2026-11-23T12:12:00.000Z"
    }
  }
  ```

### `POST /api/predictions/:locationId`
Queries the ML Service (`FastAPI` Random Forest Regressor) with current queue dynamics and stores the new forecast.
- **Response (201 Created)**:
  ```json
  {
    "message": "Forecast generated and stored successfully",
    "prediction": {
      "predictedMinutes": 28.2,
      "confidenceLevel": 0.95
    },
    "details": {
      "queueLength": 14,
      "activeCounters": 4,
      "recommendation": "Current counter capacity is optimal.",
      "algorithm": "Random Forest Regressor (QueuePulse ML Service)"
    }
  }
  ```

---

## 6. Admin Endpoints (`/api/admin`) *(Protected: `ADMIN` / `STAFF`)*

### `GET /api/admin/dashboard` *(ADMIN Only)*
High-level overview of users, locations, queues, counter utilization, and critical crowd alerts.
- **Response (200 OK)**:
  ```json
  {
    "dashboard": {
      "overview": {
        "users": 6,
        "locations": 16,
        "counters": { "total": 52, "active": 45, "utilizationPercentage": 87 },
        "queues": { "total": 64, "waiting": 32, "serving": 16, "completed": 16 },
        "reports": 16
      },
      "categoryDistribution": { "HOSPITAL": 6, "BANK": 5, "GOVERNMENT_OFFICE": 5 },
      "crowdAlerts": []
    }
  }
  ```

### `POST /api/admin/locations` *(ADMIN Only)*
Registers a new facility along with its counters in an atomic transaction.
- **Request Body**:
  ```json
  {
    "name": "Civic Health Urgent Care (Demo)",
    "category": "HOSPITAL",
    "address": "1200 Downtown Way",
    "latitude": 37.7812,
    "longitude": -122.4101,
    "openingTime": "08:00",
    "closingTime": "20:00",
    "counters": ["Triage Desk 1", "Pharmacy Window"]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Facility location created successfully",
    "location": { "id": "...", "name": "Civic Health Urgent Care (Demo)" }
  }
  ```

### `PATCH /api/admin/counters/:id` *(ADMIN or STAFF)*
Activates, deactivates, or renames a physical service counter.
- **Request Body**:
  ```json
  {
    "counterName": "Rapid Triage Desk A",
    "isActive": false
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Service counter updated successfully",
    "counter": { "id": "...", "counterName": "Rapid Triage Desk A", "isActive": false }
  }
  ```

### `PATCH /api/admin/locations/:id` *(ADMIN Only)*
Edits an existing facility's metadata (operating hours, GPS, street address, or category).
- **Request Body**:
  ```json
  {
    "name": "Metro General Hospital & Trauma Center",
    "openingTime": "07:30",
    "closingTime": "22:00"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Location updated successfully",
    "location": { "id": "...", "name": "Metro General Hospital & Trauma Center" }
  }
  ```

### `POST /api/admin/locations/:locationId/counters` *(ADMIN Only)*
Provisions a new service counter station for an existing facility.
- **Request Body**:
  ```json
  {
    "counterName": "Express Registration Window 3"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Service counter added successfully",
    "counter": { "id": "...", "counterName": "Express Registration Window 3", "isActive": true }
  }
  ```

### `PATCH /api/admin/reports/:id/verify` *(ADMIN Only)*
Flags suspicious community reports or verifies telemetry validity.
- **Request Body**:
  ```json
  {
    "verified": false
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Crowd report verification updated to false",
    "report": { "id": "...", "verified": false }
  }
  ```

### `GET /api/admin/predictions/history` *(ADMIN Only)*
Audits recent machine learning predictions across facilities.
- **Query Params**: `locationId` (optional), `limit` (default: 25)
- **Response (200 OK)**:
  ```json
  {
    "history": [
      {
        "id": "...",
        "predictedMinutes": 18.5,
        "confidenceLevel": 0.94,
        "createdAt": "2026-11-23T12:00:00.000Z",
        "location": { "name": "Metro General Hospital" }
      }
    ]
  }
  ```

---

## 7. Smart Visit Recommendation & Health Endpoints

### `GET /api/predictions/:locationId/recommendation`
Generates upcoming hourly wait-time forecasts, detects least crowded periods, and computes the optimal departure time factoring in travel duration.
- **Query Params**: `travelDuration` (optional, default: 20 minutes)
- **Response (200 OK)**:
  ```json
  {
    "locationId": "...",
    "locationName": "Metro General Hospital",
    "operatingHours": { "openingTime": "08:00", "closingTime": "20:00", "isCurrentlyOpen": true },
    "bestVisitingWindow": {
      "slot": "14:00 - 15:00",
      "expectedWaitMinutes": 9,
      "congestionLevel": "LOW"
    },
    "smartDeparture": {
      "travelDurationMinutes": 20,
      "recommendedDepartureTime": "13:40",
      "expectedArrivalTime": "14:00",
      "expectedWaitMinutes": 9,
      "totalCommittedMinutes": 29
    },
    "timeSlots": [...]
  }
  ```

### `GET /api/health`
Monitors overall health and live status of backend subsystems.
- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "service": "QueuePulse AI Backend",
    "version": "1.2.0",
    "timestamp": "2026-11-23T12:00:00.000Z",
    "uptime": "142s",
    "subsystems": {
      "database": { "status": "connected", "latencyMs": 4, "provider": "PostgreSQL" },
      "mlEngine": { "status": "connected", "latencyMs": 12, "url": "http://localhost:8000" }
    }
  }
  ```

---

## 8. Python ML Prediction Engine Endpoints (`http://localhost:8000`)

### `GET /health`
- **Response (200 OK)**: `{"status": "ok", "model_loaded": true, "model_version": "1.2.0"}`

### `GET /model-info`
- **Response (200 OK)**: Training metrics, cross-validation scores, MAE reduction vs. baseline.

### `POST /predict`
- **Request Body**:
  ```json
  {
    "queue_length": 14,
    "active_counters": 3,
    "avg_service_time": 8.5,
    "hour": 14,
    "day_of_week": 2,
    "historical_queue": 12.0,
    "crowd_reports": 2.0,
    "completion_rate": 7.0
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "predicted_wait_minutes": 28.5,
    "crowd_level": "HIGH",
    "confidence_level": 0.92,
    "model_version": "1.2.0",
    "method": "RandomForestRegressor"
  }
  ```
