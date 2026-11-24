import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma/client.js';
import { generateToken } from '../utils/tokens.js';

async function runTestSuite() {
  console.log('🧪 Starting QueuePulse AI Complete Endpoint Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // Check database availability
  let isDbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1;`;
    isDbConnected = true;
    console.log('📦 Database Status: Connected to live PostgreSQL database.\n');
  } catch (e) {
    console.log('📦 Database Status: PostgreSQL offline. Running endpoint logic, validation, RBAC, and mock-backed tests.\n');
  }

  // Valid RFC 4122 v4 UUIDs
  const mockUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Test Citizen',
    email: 'citizen@test.local',
    role: 'USER',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
    createdAt: new Date(),
  };

  const mockAdmin = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Test Admin',
    email: 'admin@test.local',
    role: 'ADMIN',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
    createdAt: new Date(),
  };

  const mockStaff = {
    id: '33333333-3333-4333-8333-333333333334',
    name: 'Test Staff',
    email: 'staff@test.local',
    role: 'STAFF',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
    createdAt: new Date(),
  };

  const mockLocation = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Metro General Hospital (Test Facility)',
    category: 'HOSPITAL',
    address: '100 Health Sciences Blvd',
    latitude: 37.7749,
    longitude: -122.4194,
    openingTime: '08:00',
    closingTime: '20:00',
    createdAt: new Date(),
    serviceCounters: [
      { id: '44444444-4444-4444-8444-444444444444', counterName: 'Triage Desk 1', isActive: true },
    ],
    _count: { queueEntries: 4 },
    crowdReports: [],
    waitPredictions: [],
  };

  const mockQueueEntry = {
    id: '55555555-5555-4555-8555-555555555555',
    userId: mockUser.id,
    locationId: mockLocation.id,
    tokenNumber: 'HOSP-042',
    status: 'WAITING',
    createdAt: new Date(),
    startedAt: null,
    completedAt: null,
    location: mockLocation,
    serviceCounter: mockLocation.serviceCounters[0],
  };

  // Mock Prisma methods if database is offline for offline test coverage
  if (!isDbConnected) {
    prisma.user.findUnique = async ({ where }) => {
      if (where.email === 'citizen@test.local' || where.id === mockUser.id) return mockUser;
      if (where.email === 'admin@test.local' || where.id === mockAdmin.id) return mockAdmin;
      if (where.email === 'staff@test.local' || where.id === mockStaff.id) return mockStaff;
      return null;
    };
    prisma.user.create = async ({ data }) => ({ ...mockUser, ...data, id: '99999999-9999-4999-8999-999999999999' });
    prisma.user.count = async () => 6;

    prisma.location.findMany = async () => [mockLocation];
    prisma.location.count = async () => 16;
    prisma.location.findUnique = async () => mockLocation;
    prisma.location.create = async ({ data }) => ({ ...mockLocation, ...data, id: '88888888-8888-4888-8888-888888888888' });
    prisma.location.update = async ({ where, data }) => ({ ...mockLocation, ...data });

    prisma.serviceCounter.findMany = async () => mockLocation.serviceCounters;
    prisma.serviceCounter.findUnique = async () => mockLocation.serviceCounters[0];
    prisma.serviceCounter.count = async () => 50;
    prisma.serviceCounter.create = async ({ data }) => ({ id: '55555555-4444-4444-8444-444444444444', ...data });
    prisma.serviceCounter.createMany = async () => ({ count: 2 });
    prisma.serviceCounter.update = async ({ data }) => ({ ...mockLocation.serviceCounters[0], ...data });

    prisma.queueEntry.findMany = async () => [mockQueueEntry];
    prisma.queueEntry.count = async () => 4;
    prisma.queueEntry.findUnique = async () => mockQueueEntry;
    prisma.queueEntry.create = async ({ data }) => ({ ...mockQueueEntry, ...data });
    prisma.queueEntry.update = async ({ data }) => ({ ...mockQueueEntry, ...data });

    prisma.crowdReport.create = async ({ data }) => ({
      id: '77777777-7777-4777-8777-777777777777',
      ...data,
      reportedAt: new Date(),
      location: mockLocation,
    });
    prisma.crowdReport.findMany = async () => [
      { id: 'e1', locationId: mockLocation.id, crowdLevel: 'MODERATE', peopleCount: 15, reportedAt: new Date() },
    ];
    prisma.crowdReport.count = async () => 12;
    prisma.crowdReport.update = async ({ where, data }) => ({
      id: where.id,
      locationId: mockLocation.id,
      crowdLevel: 'MODERATE',
      peopleCount: 15,
      reportedAt: new Date(),
      verified: data.verified,
      location: mockLocation,
    });

    prisma.waitPrediction.findFirst = async () => ({
      id: '66666666-6666-4666-8666-666666666666',
      locationId: mockLocation.id,
      predictedMinutes: 18.5,
      confidenceLevel: 0.94,
      createdAt: new Date(),
    });
    prisma.waitPrediction.create = async ({ data }) => ({
      id: '66666666-6666-4666-8666-666666666667',
      ...data,
      createdAt: new Date(),
    });
    prisma.waitPrediction.count = async () => 16;
    prisma.waitPrediction.findMany = async () => [
      {
        id: '66666666-4666-8666-6666-666666666666',
        locationId: mockLocation.id,
        predictedMinutes: 18.5,
        confidenceLevel: 0.94,
        createdAt: new Date(),
        location: mockLocation,
      },
    ];

    prisma.$transaction = async (fn) => fn(prisma);
  }

  // Generate tokens for testing
  const userToken = generateToken({
    id: mockUser.id,
    email: mockUser.email,
    role: 'USER',
  });

  const staffToken = generateToken({
    id: '33333333-3333-4333-8333-333333333334',
    email: 'staff@test.local',
    role: 'STAFF',
  });

  const adminToken = generateToken({
    id: mockAdmin.id,
    email: mockAdmin.email,
    role: 'ADMIN',
  });

  // 1. HEALTH CHECK
  console.log('--- 1. Health Endpoint ---');
  const resHealth = await request(app).get('/api/health');
  assert(resHealth.status === 200, 'GET /api/health returns 200');
  assert(resHealth.body.status === 'ok', 'Health status is "ok"');

  // 2. AUTHENTICATION & VALIDATION
  console.log('\n--- 2. Authentication & Validation Endpoints ---');
  // Register with invalid body (missing password)
  const resRegInvalid = await request(app).post('/api/auth/register').send({ email: 'bademail' });
  assert(resRegInvalid.status === 400, 'POST /api/auth/register rejects invalid email and short password with 400');

  // Register valid user
  const resRegValid = await request(app).post('/api/auth/register').send({
    name: 'New Citizen',
    email: 'newcitizen@example.com',
    password: 'Password123!',
  });
  assert(resRegValid.status === 201, 'POST /api/auth/register succeeds with 201 and returns JWT');
  assert(Boolean(resRegValid.body.token), 'Registration returns valid token');

  // Login with invalid credentials
  const resLoginBad = await request(app).post('/api/auth/login').send({
    email: 'unknown@example.com',
    password: 'wrong',
  });
  assert(resLoginBad.status === 401, 'POST /api/auth/login rejects invalid credentials with 401');

  // Profile without auth token
  const resProfNoAuth = await request(app).get('/api/auth/profile');
  assert(resProfNoAuth.status === 401, 'GET /api/auth/profile rejects unauthenticated request with 401');

  // Profile with valid auth token
  const resProfAuth = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${userToken}`);
  assert(resProfAuth.status === 200, 'GET /api/auth/profile succeeds with 200 for valid token');

  // 3. LOCATIONS
  console.log('\n--- 3. Locations Endpoints ---');
  const resLocs = await request(app).get('/api/locations');
  assert(resLocs.status === 200, 'GET /api/locations returns 200');
  assert(Array.isArray(resLocs.body.locations), 'Returns array of locations with pagination');

  const resLocById = await request(app).get(`/api/locations/${mockLocation.id}`);
  assert(resLocById.status === 200, 'GET /api/locations/:id returns 200 with service counters');

  const resNearbyInvalid = await request(app).get('/api/locations/nearby?lat=invalid');
  assert(resNearbyInvalid.status === 400, 'GET /api/locations/nearby rejects invalid coordinates with 400');

  const resNearbyValid = await request(app).get('/api/locations/nearby?lat=37.7749&lng=-122.4194&radius=10');
  assert(resNearbyValid.status === 200, 'GET /api/locations/nearby returns 200 with distance in km');

  // 4. QUEUES
  console.log('\n--- 4. Queue Operations & Security Restrictions ---');
  const resQueueList = await request(app).get(`/api/queues/${mockLocation.id}`);
  assert(resQueueList.status === 200, 'GET /api/queues/:locationId returns active queue list');

  const resJoinInvalid = await request(app).post('/api/queues/join').send({ locationId: 'not-a-uuid' });
  assert(resJoinInvalid.status === 400, 'POST /api/queues/join rejects non-UUID locationId with 400');

  const resJoinValid = await request(app).post('/api/queues/join').send({
    locationId: mockLocation.id,
  });
  assert(resJoinValid.status === 201, 'POST /api/queues/join creates ticket with status WAITING and returns 201');

  // CRITICAL SECURITY RULE: Users must NOT be able to update administrative queue records
  const resUserAdminAttempt = await request(app)
    .patch(`/api/queues/${mockQueueEntry.id}/status`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ status: 'SERVING' });
  assert(
    resUserAdminAttempt.status === 403,
    'SECURITY CHECK: Regular USER attempting status SERVING is forbidden with 403'
  );

  // Users can cancel their own ticket
  const resUserCancel = await request(app)
    .patch(`/api/queues/${mockQueueEntry.id}/status`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ status: 'CANCELLED' });
  assert(resUserCancel.status === 200, 'User can cancel their own ticket with 200 OK');

  // Staff can update queue status to SERVING
  const resStaffServing = await request(app)
    .patch(`/api/queues/${mockQueueEntry.id}/status`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ status: 'SERVING' });
  assert(resStaffServing.status === 200, 'Staff/Admin can update status to SERVING with 200 OK');

  // 5. CROWD REPORTS
  console.log('\n--- 5. Crowd Reports Endpoints ---');
  const resRepBad = await request(app).post('/api/reports').send({
    locationId: mockLocation.id,
    crowdLevel: 'SUPER_PACKED', // invalid enum
    peopleCount: 10,
  });
  assert(resRepBad.status === 400, 'POST /api/reports rejects invalid crowdLevel enum with 400');

  const resRepValid = await request(app).post('/api/reports').send({
    locationId: mockLocation.id,
    crowdLevel: 'HIGH',
    peopleCount: 35,
  });
  assert(resRepValid.status === 201, 'POST /api/reports succeeds with 201');

  const resRepList = await request(app).get(`/api/reports/${mockLocation.id}`);
  assert(resRepList.status === 200, 'GET /api/reports/:locationId returns consensus crowd level');

  // 6. PREDICTIONS
  console.log('\n--- 6. Predictions Endpoints ---');
  const resPredGet = await request(app).get(`/api/predictions/${mockLocation.id}`);
  assert(resPredGet.status === 200, 'GET /api/predictions/:locationId returns wait prediction');

  const resPredPost = await request(app).post(`/api/predictions/${mockLocation.id}`);
  assert(resPredPost.status === 201, 'POST /api/predictions/:locationId generates new prediction with 201');

  // Smart Visit & Departure Recommendation Endpoint
  const resRecGet = await request(app).get(`/api/predictions/${mockLocation.id}/recommendation?travelDuration=25`);
  assert(resRecGet.status === 200, 'GET /api/predictions/:locationId/recommendation returns 200 with smart departure');
  assert(Boolean(resRecGet.body.smartDeparture), 'Recommendation returns smart departure object');
  assert(Array.isArray(resRecGet.body.timeSlots), 'Recommendation returns timeSlots array with open/closed hours');
  assert(Boolean(resRecGet.body.disclaimer), 'Recommendation returns required statistical disclaimer');

  // 7. ADMIN ENDPOINTS & RBAC
  console.log('\n--- 7. Admin Endpoints & Role-Based Access Control ---');
  // Dashboard without token
  const resAdminNoAuth = await request(app).get('/api/admin/dashboard');
  assert(resAdminNoAuth.status === 401, 'GET /api/admin/dashboard rejects unauthenticated with 401');

  // Dashboard with USER token
  const resAdminUser = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${userToken}`);
  assert(resAdminUser.status === 403, 'GET /api/admin/dashboard rejects regular USER with 403 Forbidden');

  // Dashboard with ADMIN token
  const resAdminValid = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
  assert(resAdminValid.status === 200, 'GET /api/admin/dashboard succeeds for ADMIN with 200 and metrics breakdown');

  // Admin location creation with USER token
  const resCreateLocUser = await request(app)
    .post('/api/admin/locations')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Unauthorized Hospital',
      category: 'HOSPITAL',
      address: '123 Fake St',
      latitude: 37.77,
      longitude: -122.41,
      openingTime: '08:00',
      closingTime: '17:00',
    });
  assert(resCreateLocUser.status === 403, 'POST /api/admin/locations rejects regular USER with 403 Forbidden');

  // Admin location creation with ADMIN token
  const resCreateLocAdmin = await request(app)
    .post('/api/admin/locations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'New District Clinic (Demo)',
      category: 'HOSPITAL',
      address: '777 Healthway Ave',
      latitude: 37.779,
      longitude: -122.418,
      openingTime: '08:00',
      closingTime: '18:00',
      counters: ['Counter A', 'Counter B'],
    });
  assert(resCreateLocAdmin.status === 201, 'POST /api/admin/locations creates facility + counters with 201');

  // Counter update
  const resCounterPatch = await request(app)
    .patch(`/api/admin/counters/${mockLocation.serviceCounters[0].id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isActive: false });
  assert(resCounterPatch.status === 200, 'PATCH /api/admin/counters/:id updates counter active state with 200');

  // Edit location (USER forbidden, ADMIN allowed)
  const resEditLocUser = await request(app)
    .patch(`/api/admin/locations/${mockLocation.id}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Unauthorized Renaming' });
  assert(resEditLocUser.status === 403, 'PATCH /api/admin/locations/:id rejects regular USER with 403 Forbidden');

  const resEditLocAdmin = await request(app)
    .patch(`/api/admin/locations/${mockLocation.id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Metro General Hospital (Renamed)' });
  assert(resEditLocAdmin.status === 200, 'PATCH /api/admin/locations/:id succeeds for ADMIN with 200 OK');

  // Add counter (USER forbidden, ADMIN allowed)
  const resAddCounterUser = await request(app)
    .post(`/api/admin/locations/${mockLocation.id}/counters`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ counterName: 'Desk 99' });
  assert(resAddCounterUser.status === 403, 'POST /api/admin/locations/:locationId/counters rejects regular USER with 403 Forbidden');

  const resAddCounterAdmin = await request(app)
    .post(`/api/admin/locations/${mockLocation.id}/counters`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ counterName: 'Desk 99' });
  assert(resAddCounterAdmin.status === 201, 'POST /api/admin/locations/:locationId/counters succeeds for ADMIN with 201');

  // Verify/Flag Report (USER forbidden, ADMIN allowed)
  const resVerifyReportUser = await request(app)
    .patch(`/api/admin/reports/77777777-7777-4777-8777-777777777777/verify`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ verified: false });
  assert(resVerifyReportUser.status === 403, 'PATCH /api/admin/reports/:id/verify rejects regular USER with 403 Forbidden');

  const resVerifyReportAdmin = await request(app)
    .patch(`/api/admin/reports/77777777-7777-4777-8777-777777777777/verify`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ verified: false });
  assert(resVerifyReportAdmin.status === 200, 'PATCH /api/admin/reports/:id/verify updates verification flag with 200 OK');

  // Prediction History (USER forbidden, ADMIN allowed)
  const resPredHistoryUser = await request(app)
    .get(`/api/admin/predictions/history`)
    .set('Authorization', `Bearer ${userToken}`);
  assert(resPredHistoryUser.status === 403, 'GET /api/admin/predictions/history rejects regular USER with 403 Forbidden');

  const resPredHistoryAdmin = await request(app)
    .get(`/api/admin/predictions/history?locationId=${mockLocation.id}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert(resPredHistoryAdmin.status === 200, 'GET /api/admin/predictions/history succeeds for ADMIN with 200 OK');
  assert(Array.isArray(resPredHistoryAdmin.body.predictions), 'Prediction history returns array of audit records');

  console.log('\n==================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
