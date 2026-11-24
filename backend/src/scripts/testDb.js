import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnectivity() {
  console.log('🔍 Testing QueuePulse AI PostgreSQL Database Connectivity...');
  console.log(`🌐 Target: ${process.env.DATABASE_URL || '(default DATABASE_URL from .env)'}`);

  try {
    const startTime = Date.now();
    // 1. Raw query test
    await prisma.$queryRaw`SELECT 1 as connected;`;
    const latency = Date.now() - startTime;
    console.log(`✅ Connection established successfully! (Latency: ${latency}ms)`);

    // 2. Query model counts
    const [userCount, locationCount, counterCount, queueCount, reportCount, predictionCount] = await Promise.all([
      prisma.user.count(),
      prisma.location.count(),
      prisma.serviceCounter.count(),
      prisma.queueEntry.count(),
      prisma.crowdReport.count(),
      prisma.waitPrediction.count(),
    ]);

    console.log('\n📊 Current Database Statistics:');
    console.log(`   - Users:            ${userCount}`);
    console.log(`   - Locations:        ${locationCount}`);
    console.log(`   - Service Counters: ${counterCount}`);
    console.log(`   - Queue Entries:    ${queueCount}`);
    console.log(`   - Crowd Reports:    ${reportCount}`);
    console.log(`   - Wait Predictions: ${predictionCount}`);

    if (locationCount === 0) {
      console.log('\n💡 Tip: Your database tables are created but empty. Run `npm run prisma:seed` to seed demo data.');
    } else {
      console.log('\n🎉 Demonstration fixtures are loaded and ready for operations!');
    }

    return { connected: true, latency };
  } catch (err) {
    console.error('\n❌ Database Connection Failed!');
    console.error(`   Error message: ${err.message}`);
    console.log('\n🛠️ Troubleshooting Tips:');
    console.log('   1. Ensure PostgreSQL is running on port 5432:');
    console.log('      - Docker option: run `docker compose up -d` in the root folder');
    console.log('      - Local service: Start PostgreSQL service in Windows Services (services.msc)');
    console.log('      - Cloud option: Update DATABASE_URL in `backend/.env` with your Neon / Supabase connection string');
    console.log('   2. Verify credentials in `backend/.env`:');
    console.log('      DATABASE_URL="postgresql://postgres:postgres@localhost:5432/queuepulse_db?schema=public"');
    console.log('   3. Run migrations once the DB is running:');
    console.log('      npm run prisma:deploy (or npm run prisma:migrate)\n');
    return { connected: false, error: err.message };
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnectivity();
