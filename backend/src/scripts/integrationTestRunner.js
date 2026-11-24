import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import prisma from '../prisma/client.js';
import { generateToken } from '../utils/tokens.js';
import fs from 'fs';
import path from 'path';

async function runIntegrationSuite() {
  console.log('============================================================');
  console.log('🚀 QUEUEPULSE AI - FULL INTEGRATION & VERIFICATION SUITE');
  console.log('============================================================\n');

  let passedTests = [];
  let failedTests = [];

  function record(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests.push({ testName, details });
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      failedTests.push({ testName, details });
    }
  }

  // -----------------------------------------------------------------------
  // 0. Database & Environment Diagnostics
  // -----------------------------------------------------------------------
  console.log('--- 0. Diagnostics & Infrastructure ---');
  let isDbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1;`;
    isDbConnected = true;
    record(true, 'PostgreSQL Database Connectivity', 'Connected to live PostgreSQL database');
  } catch (err) {
    record(false, 'PostgreSQL Database Connectivity', 'PostgreSQL offline at localhost:5432 (fallback mocks active)');
  }

  const validPasswordHash = await bcrypt.hash('Password123!', 10);

  const mockUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Citizen Traveler',
    email: 'traveler@queuepulse.test',
    role: 'USER',
    passwordHash: validPasswordHash,
    createdAt: new Date(),
  };

  const mockAdmin = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'System Administrator',
    email: 'admin@queuepulse.test',
    role: 'ADMIN',
    passwordHash: validPasswordHash,
    createdAt: new Date(),
  };

  const mockLocation = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'San Francisco General Hospital',
    category: 'HOSPITAL',
    address: '1001 Potrero Ave, San Francisco, CA',
    latitude: 37.7558,
    longitude: -122.4048,
    openingTime: '08:00',
    closingTime: '20:00',
    createdAt: new Date(),
    serviceCounters: [
      { id: '44444444-4444-4444-8444-444444444444', counterName: 'Emergency Triage 1', isActive: true },
      { id: '44444444-4444-4444-8444-444444444445', counterName: 'Emergency Triage 2', isActive: true },
    ],
    _count: { queueEntries: 5 },
    crowdReports: [],
    waitPredictions: [],
  };

  const mockTicket = {
    id: '55555555-5555-4555-8555-555555555555',
    userId: mockUser.id,
    locationId: mockLocation.id,
    tokenNumber: 'HOSP-104',
    status: 'WAITING',
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    location: mockLocation,
    serviceCounter: mockLocation.serviceCounters[0],
  };

  if (!isDbConnected) {
    prisma.user.findUnique = async ({ where }) => {
      if (where.email === mockUser.email || where.id === mockUser.id) return mockUser;
      if (where.email === mockAdmin.email || where.id === mockAdmin.id) return mockAdmin;
      return null;
    };
    prisma.user.create = async ({ data }) => ({ ...mockUser, ...data, id: '11111111-2222-3333-4444-555555555555' });
    prisma.user.count = async () => 18;

    prisma.location.findMany = async () => [mockLocation];
    prisma.location.findUnique = async () => mockLocation;
    prisma.location.count = async () => 15;
    prisma.location.create = async ({ data }) => ({ ...mockLocation, ...data, id: '88888888-8888-4888-8888-888888888888' });
    prisma.location.update = async ({ where, data }) => ({ ...mockLocation, ...data });

    prisma.serviceCounter.findMany = async () => mockLocation.serviceCounters;
    prisma.serviceCounter.findUnique = async () => mockLocation.serviceCounters[0];
    prisma.serviceCounter.count = async () => 48;
    prisma.serviceCounter.create = async ({ data }) => ({ id: '99999999-4444-4444-8444-444444444444', ...data });
    prisma.serviceCounter.createMany = async () => ({ count: 2 });
    prisma.serviceCounter.update = async ({ data }) => ({ ...mockLocation.serviceCounters[0], ...data });

    prisma.queueEntry.findMany = async () => [mockTicket];
    prisma.queueEntry.findUnique = async () => mockTicket;
    prisma.queueEntry.count = async () => 8;
    prisma.queueEntry.create = async ({ data }) => ({ ...mockTicket, ...data });
    prisma.queueEntry.update = async ({ data }) => ({ ...mockTicket, ...data });

    prisma.crowdReport.create = async ({ data }) => ({
      id: '77777777-7777-4777-8777-777777777777',
      ...data,
      reportedAt: new Date(),
      location: mockLocation,
    });
    prisma.crowdReport.findMany = async () => [
      {
        id: '77777777-7777-4777-8777-777777777777',
        locationId: mockLocation.id,
        crowdLevel: 'MODERATE',
        peopleCount: 16,
        reportedAt: new Date(),
        verified: true,
      },
    ];
    prisma.crowdReport.count = async () => 24;
    prisma.crowdReport.update = async ({ where, data }) => ({
      id: where.id,
      locationId: mockLocation.id,
      crowdLevel: 'MODERATE',
      peopleCount: 16,
      reportedAt: new Date(),
      verified: data.verified,
      location: mockLocation,
    });

    prisma.waitPrediction.findFirst = async () => ({
      id: '66666666-4666-8666-6666-666666666666',
      locationId: mockLocation.id,
      predictedMinutes: 14.5,
      confidenceLevel: 0.94,
      createdAt: new Date(),
    });
    prisma.waitPrediction.findMany = async () => [
      {
        id: '66666666-4666-8666-6666-666666666666',
        locationId: mockLocation.id,
        predictedMinutes: 14.5,
        confidenceLevel: 0.94,
        createdAt: new Date(),
        location: mockLocation,
      },
    ];
    prisma.waitPrediction.create = async ({ data }) => ({
      id: '66666666-4666-8666-6666-666666666667',
      ...data,
      createdAt: new Date(),
    });
    prisma.waitPrediction.count = async () => 32;

    prisma.$transaction = async (fn) => fn(prisma);
  }

  const userJwt = generateToken({ id: mockUser.id, email: mockUser.email, role: 'USER' });
  const adminJwt = generateToken({ id: mockAdmin.id, email: mockAdmin.email, role: 'ADMIN' });

  // -----------------------------------------------------------------------
  // 1. USER JOURNEY TESTS
  // -----------------------------------------------------------------------
  console.log('\n--- 1. User Journey Verification ---');

  // Step 1: Register
  const resReg = await request(app).post('/api/auth/register').send({
    name: 'New Citizen User',
    email: 'newuser@queuepulse.test',
    password: 'SecurePassword123!',
  });
  record(resReg.status === 201 && Boolean(resReg.body.token), 'USER: Register account (POST /api/auth/register)');

  // Step 2: Login
  const resLogin = await request(app).post('/api/auth/login').send({
    email: mockUser.email,
    password: 'Password123!',
  });
  record(resLogin.status === 200 && Boolean(resLogin.body.token), 'USER: Login account (POST /api/auth/login)');

  // Step 3: View profile
  const resProfile = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${userJwt}`);
  record(resProfile.status === 200 && resProfile.body.user?.email === mockUser.email, 'USER: View profile (GET /api/auth/profile)');

  // Step 4: Search locations
  const resSearch = await request(app).get('/api/locations?query=General&category=HOSPITAL');
  record(resSearch.status === 200 && Array.isArray(resSearch.body.locations), 'USER: Search locations by category & keyword (GET /api/locations)');

  // Step 5: Nearby locations
  const resNearby = await request(app).get('/api/locations/nearby?lat=37.7558&lng=-122.4048&radius=10');
  record(resNearby.status === 200 && Array.isArray(resNearby.body.locations), 'USER: Discover nearby facilities with GPS (GET /api/locations/nearby)');

  // Step 6: View queue information
  const resQueueInfo = await request(app).get(`/api/queues/${mockLocation.id}`);
  record(
    resQueueInfo.status === 200 &&
      (resQueueInfo.body.stats?.waitingCount !== undefined || resQueueInfo.body.queueLength !== undefined),
    'USER: View queue depth and active desks (GET /api/queues/:locationId)'
  );

  // Step 7: Join queue / book token
  const resJoinQueue = await request(app)
    .post('/api/queues/join')
    .set('Authorization', `Bearer ${userJwt}`)
    .send({ locationId: mockLocation.id });
  record(
    resJoinQueue.status === 201 && resJoinQueue.body.queueEntry?.status === 'WAITING',
    'USER: Join queue and generate token (POST /api/queues/join)'
  );

  // Step 8: View crowd status
  const resCrowd = await request(app).get(`/api/reports/${mockLocation.id}`);
  record(
    resCrowd.status === 200 &&
      (resCrowd.body.weightedCrowdEstimate !== undefined || resCrowd.body.consensusCrowdLevel !== undefined),
    'USER: View crowd status & consensus (GET /api/reports/:locationId)'
  );

  // Step 9: Submit crowd report
  const resSubmitReport = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${userJwt}`)
    .send({
      locationId: mockLocation.id,
      crowdLevel: 'HIGH',
      peopleCount: 28,
      notes: 'Lobby full, triage moving slowly.',
    });
  record(resSubmitReport.status === 201 && resSubmitReport.body.report?.crowdLevel === 'HIGH', 'USER: Submit crowd observation (POST /api/reports)');

  // Step 10: Generate waiting-time prediction
  const resPredict = await request(app).post(`/api/predictions/${mockLocation.id}`);
  record(
    resPredict.status === 201 && resPredict.body.prediction?.predictedMinutes !== undefined,
    'USER: Generate waiting-time prediction (POST /api/predictions/:locationId)'
  );

  // Step 11: View visiting-time recommendation
  const resRecommendation = await request(app).get(`/api/predictions/${mockLocation.id}/recommendation?travelDuration=20`);
  record(
    resRecommendation.status === 200 && Boolean(resRecommendation.body.smartDeparture) && Array.isArray(resRecommendation.body.timeSlots),
    'USER: View smart visit & departure recommendation (GET /api/predictions/:locationId/recommendation)'
  );

  // -----------------------------------------------------------------------
  // 2. ADMIN JOURNEY TESTS
  // -----------------------------------------------------------------------
  console.log('\n--- 2. Admin Journey Verification ---');

  // Step 1: Admin login
  const resAdminLogin = await request(app).post('/api/auth/login').send({
    email: mockAdmin.email,
    password: 'Password123!',
  });
  record(resAdminLogin.status === 200 && Boolean(resAdminLogin.body.token), 'ADMIN: Login to administrative session (POST /api/auth/login)');

  // Step 2: View analytics & metrics
  const resDashboard = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminJwt}`);
  const dashboardStats = resDashboard.body.dashboard || resDashboard.body;
  record(
    resDashboard.status === 200 &&
      (dashboardStats.overview?.locations !== undefined || dashboardStats.totalLocations !== undefined) &&
      dashboardStats.hourlyCongestion !== undefined &&
      dashboardStats.historicalTrends !== undefined,
    'ADMIN: View mission control analytics & Recharts datasets (GET /api/admin/dashboard)'
  );

  // Step 3: Add location
  const resAddLoc = await request(app)
    .post('/api/admin/locations')
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({
      name: 'Downtown Civic Licensing Hub',
      category: 'GOVERNMENT_OFFICE',
      address: '450 Golden Gate Ave, San Francisco, CA',
      latitude: 37.7812,
      longitude: -122.4187,
      openingTime: '08:30',
      closingTime: '16:30',
      counters: ['Permit Window 1', 'Permit Window 2'],
    });
  record(resAddLoc.status === 201 && resAddLoc.body.location?.name !== undefined, 'ADMIN: Add new public facility (POST /api/admin/locations)');

  // Step 4: Edit location
  const resEditLoc = await request(app)
    .patch(`/api/admin/locations/${mockLocation.id}`)
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({ name: 'San Francisco General Hospital & Trauma Center' });
  record(resEditLoc.status === 200, 'ADMIN: Edit facility metadata (PATCH /api/admin/locations/:id)');

  // Step 5: Create service counter
  const resAddCounter = await request(app)
    .post(`/api/admin/locations/${mockLocation.id}/counters`)
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({ counterName: 'Urgent Care Intake 3' });
  record(resAddCounter.status === 201, 'ADMIN: Provision service counter (POST /api/admin/locations/:id/counters)');

  // Step 6: Toggle service counter
  const resToggleCounter = await request(app)
    .patch(`/api/admin/counters/${mockLocation.serviceCounters[0].id}`)
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({ isActive: false });
  record(resToggleCounter.status === 200, 'ADMIN: Toggle counter online/offline state (PATCH /api/admin/counters/:id)');

  // Step 7: Update queue status (Call to Desk)
  const resQueueServing = await request(app)
    .patch(`/api/queues/${mockTicket.id}/status`)
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({ status: 'SERVING' });
  record(resQueueServing.status === 200, 'ADMIN: Dispatch ticket to SERVING (PATCH /api/queues/:id/status)');

  // Step 8: Update queue status (Complete Ticket)
  const resQueueCompleted = await request(app)
    .patch(`/api/queues/${mockTicket.id}/status`)
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({ status: 'COMPLETED' });
  record(resQueueCompleted.status === 200, 'ADMIN: Mark ticket as COMPLETED (PATCH /api/queues/:id/status)');

  // Step 9: Review reports & flag suspicious report
  const resVerifyReport = await request(app)
    .patch(`/api/admin/reports/77777777-7777-4777-8777-777777777777/verify`)
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({ verified: false });
  record(resVerifyReport.status === 200, 'ADMIN: Flag suspicious crowd report (PATCH /api/admin/reports/:id/verify)');

  // Step 10: View prediction history
  const resPredHistory = await request(app).get(`/api/admin/predictions/history`).set('Authorization', `Bearer ${adminJwt}`);
  record(resPredHistory.status === 200 && Array.isArray(resPredHistory.body.history), 'ADMIN: Audit prediction log history (GET /api/admin/predictions/history)');

  // -----------------------------------------------------------------------
  // 3. SECURITY, VALIDATION & RBAC CHECKS
  // -----------------------------------------------------------------------
  console.log('\n--- 3. Security, Authorization & Validation Guardrails ---');

  // Security: Unauthenticated dashboard access
  const resSecNoAuth = await request(app).get('/api/admin/dashboard');
  record(resSecNoAuth.status === 401, 'SECURITY: Unauthenticated dashboard request rejected with 401');

  // Security: Regular USER forbidden from admin routes
  const resSecUserAdmin = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${userJwt}`);
  record(resSecUserAdmin.status === 403, 'SECURITY: Citizen user blocked from admin dashboard with 403 Forbidden');

  // Security: Regular USER cannot advance ticket to SERVING
  const resSecUserAdvance = await request(app)
    .patch(`/api/queues/${mockTicket.id}/status`)
    .set('Authorization', `Bearer ${userJwt}`)
    .send({ status: 'SERVING' });
  record(resSecUserAdvance.status === 403, 'SECURITY: Regular citizen forbidden from setting ticket to SERVING with 403');

  // Validation: Invalid email in registration
  const resValEmail = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });
  record(resValEmail.status === 400, 'VALIDATION: Invalid email and weak password rejected with 400 Bad Request');

  // Validation: Invalid crowd level enum
  const resValEnum = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${userJwt}`)
    .send({ locationId: mockLocation.id, crowdLevel: 'MEGA_CROWD', peopleCount: 5 });
  record(resValEnum.status === 400, 'VALIDATION: Unrecognized crowdLevel enum rejected with 400 Bad Request');

  // Validation: Invalid GPS latitude
  const resValGps = await request(app).get('/api/locations/nearby?lat=999&lng=-122.4');
  record(resValGps.status === 400, 'VALIDATION: Out-of-bounds latitude (999) rejected with 400 Bad Request');

  // -----------------------------------------------------------------------
  // 4. ML ENGINE & BASELINE FALLBACK CHECKS
  // -----------------------------------------------------------------------
  console.log('\n--- 4. Machine Learning & Baseline Fallback Verification ---');

  // Check model file existence
  const modelFilePath = path.resolve('../ml-service/models/queue_wait_time_rf.joblib');
  const modelExists = fs.existsSync(modelFilePath);
  record(modelExists, 'ML: Trained Random Forest model file exists on disk', modelFilePath);

  // Test baseline fallback logic in backend
  const resPredFallback = await request(app).post(`/api/predictions/${mockLocation.id}`);
  const waitMins = resPredFallback.body.prediction?.predictedMinutes;
  record(
    typeof waitMins === 'number' && waitMins >= 0,
    'ML: Non-negative waiting-time prediction guaranteed',
    `Predicted: ${waitMins} mins`
  );

  // -----------------------------------------------------------------------
  // 5. SUMMARY REPORT
  // -----------------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`📊 INTEGRATION RESULTS: ${passedTests.length} PASSED, ${failedTests.length} FAILED`);
  console.log('============================================================\n');

  if (failedTests.length > 0) {
    console.log('Failed tests:');
    failedTests.forEach((t) => console.log(`  - ${t.testName}: ${t.details}`));
  }

  // We exit 0 if all core tests passed (or if only live database was offline which is handled by mock)
  const criticalFailures = failedTests.filter(
    (t) => !t.testName.includes('PostgreSQL Database Connectivity')
  );

  if (criticalFailures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIntegrationSuite().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
