import request from 'supertest';
import app from '../app.js';

async function verifyDemoMode() {
  console.log('============================================================');
  console.log('🎯 QUEUEPULSE AI - OFFLINE DEMO MODE VERIFICATION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message} - ${details}`);
      failed++;
    }
  }

  // 1. User Login Works
  console.log('--- 1. User Login Verification ---');
  const resUserLogin = await request(app).post('/api/auth/login').send({
    email: 'jordan.miller@demo.local',
    password: 'QueuePulse2026!',
  });
  assert(resUserLogin.status === 200 && Boolean(resUserLogin.body.token), 'Citizen Login: jordan.miller@demo.local returns JWT token');
  const userToken = resUserLogin.body.token;

  // 2. Admin Login Works
  console.log('\n--- 2. Admin Login Verification ---');
  const resAdminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@queuepulse.demo',
    password: 'QueuePulse2026!',
  });
  assert(resAdminLogin.status === 200 && Boolean(resAdminLogin.body.token), 'Admin Login: admin@queuepulse.demo returns JWT token');
  const adminToken = resAdminLogin.body.token;

  // 3. Locations Load
  console.log('\n--- 3. Locations Loading Verification ---');
  const resLocs = await request(app).get('/api/locations');
  assert(
    resLocs.status === 200 && Array.isArray(resLocs.body.locations) && resLocs.body.locations.length > 0,
    'Locations Load: GET /api/locations returns 16 facilities with queue metadata'
  );

  const testLocationId = resLocs.body.locations[0].id;

  // 4. Queue Data Loads
  console.log('\n--- 4. Queue Data Loading Verification ---');
  const resQueue = await request(app).get(`/api/queues/${testLocationId}`);
  assert(
    resQueue.status === 200 && resQueue.body.stats !== undefined && resQueue.body.activeQueues !== undefined,
    'Queue Data Loads: GET /api/queues/:locationId returns active desks & live waiting patrons'
  );

  // Test Joining Queue
  const resJoin = await request(app)
    .post('/api/queues/join')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ locationId: testLocationId });
  assert(
    resJoin.status === 201 && Boolean(resJoin.body.queueEntry?.tokenNumber),
    `Join Queue Works: Generated token ${resJoin.body.queueEntry?.tokenNumber}`
  );

  // 5. Predictions Work
  console.log('\n--- 5. Predictions Engine Verification ---');
  const resPred = await request(app).post(`/api/predictions/${testLocationId}`);
  assert(
    resPred.status === 201 && typeof resPred.body.prediction?.predictedMinutes === 'number',
    `Predictions Work: Estimated wait ${resPred.body.prediction?.predictedMinutes} mins (Confidence: ${resPred.body.prediction?.confidenceLevel})`
  );

  // 6. Crowd Reporting Works
  console.log('\n--- 6. Crowd Reporting Verification ---');
  const resReport = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      locationId: testLocationId,
      crowdLevel: 'MODERATE',
      peopleCount: 15,
      notes: 'Demo crowd update for presentation',
    });
  assert(
    resReport.status === 201 && resReport.body.report?.crowdLevel === 'MODERATE',
    'Crowd Reporting Works: Observation recorded with trust badge'
  );

  const resReportList = await request(app).get(`/api/reports/${testLocationId}`);
  assert(
    resReportList.status === 200 && Boolean(resReportList.body.weightedCrowdEstimate),
    'Crowd Status Consensus: Returns weighted crowd level & active observer count'
  );

  // 7. Recommendations Work
  console.log('\n--- 7. Smart Visit Recommendations Verification ---');
  const resRec = await request(app).get(`/api/predictions/${testLocationId}/recommendation?travelDuration=25`);
  assert(
    resRec.status === 200 && Boolean(resRec.body.smartDeparture) && Boolean(resRec.body.bestVisitingWindow),
    `Recommendations Work: Best window is ${resRec.body.bestVisitingWindow?.windowLabel} (Leave at ${resRec.body.smartDeparture?.recommendedDepartureTime})`
  );

  console.log('\n============================================================');
  console.log(`📊 DEMO MODE VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyDemoMode().catch((err) => {
  console.error('Fatal demo verification error:', err);
  process.exit(1);
});
