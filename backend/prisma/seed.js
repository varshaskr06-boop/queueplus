import { PrismaClient, UserRole, LocationCategory, QueueStatus, CrowdLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Fictional demonstration data (All locations, tokens, and users are strictly fictional demo fixtures)
const DEMO_LOCATIONS = [
  // --- 1. HOSPITALS (6 Fictional Demonstration Locations) ---
  {
    name: 'Metro Central General Hospital (Demo Facility)',
    category: LocationCategory.HOSPITAL,
    address: '100 Health Sciences Blvd, Metro City, ST 90210',
    latitude: 37.7749,
    longitude: -122.4194,
    openingTime: '00:00', // 24/7
    closingTime: '23:59',
    counters: [
      { counterName: 'Triage Desk 1 - Adult Care', isActive: true },
      { counterName: 'Triage Desk 2 - Rapid Assessment', isActive: true },
      { counterName: 'Outpatient Registration Window A', isActive: true },
      { counterName: 'Outpatient Registration Window B', isActive: false },
      { counterName: 'Diagnostic & Lab Check-in', isActive: true },
    ],
  },
  {
    name: 'St. Luke Memorial Healthcare Center (Demo Facility)',
    category: LocationCategory.HOSPITAL,
    address: '450 Medical Arts Parkway, East District, ST 90215',
    latitude: 37.7833,
    longitude: -122.4167,
    openingTime: '06:00',
    closingTime: '22:00',
    counters: [
      { counterName: 'Admissions Desk 1', isActive: true },
      { counterName: 'Radiology & Imaging Reception', isActive: true },
      { counterName: 'General Consultation Desk', isActive: true },
    ],
  },
  {
    name: 'Pine Valley Regional Trauma & Urgent Care (Demo Facility)',
    category: LocationCategory.HOSPITAL,
    address: '820 Evergreen Way, North Valley, ST 90220',
    latitude: 37.7900,
    longitude: -122.4050,
    openingTime: '07:00',
    closingTime: '23:00',
    counters: [
      { counterName: 'Urgent Care Intake 1', isActive: true },
      { counterName: 'Urgent Care Intake 2', isActive: true },
      { counterName: 'Pediatric Check-in', isActive: true },
    ],
  },
  {
    name: "Riverside Community Children's Clinic (Demo Facility)",
    category: LocationCategory.HOSPITAL,
    address: '310 Riverbank Road, South Riverside, ST 90225',
    latitude: 37.7650,
    longitude: -122.4300,
    openingTime: '08:00',
    closingTime: '18:00',
    counters: [
      { counterName: 'Pediatric Triage Station', isActive: true },
      { counterName: 'Immunization Check-in Desk', isActive: true },
    ],
  },
  {
    name: 'Apex University Medical Center (Demo Facility)',
    category: LocationCategory.HOSPITAL,
    address: '550 Campus Health Square, University Heights, ST 90230',
    latitude: 37.7550,
    longitude: -122.4400,
    openingTime: '07:30',
    closingTime: '21:00',
    counters: [
      { counterName: 'Specialty Clinic Intake Desk 1', isActive: true },
      { counterName: 'Specialty Clinic Intake Desk 2', isActive: true },
      { counterName: 'Pharmacy Dispensing Counter', isActive: true },
    ],
  },
  {
    name: 'Beacon Hill Specialty & Diagnostic Center (Demo Facility)',
    category: LocationCategory.HOSPITAL,
    address: '780 Beacon Heights Road, West End, ST 90235',
    latitude: 37.7450,
    longitude: -122.4500,
    openingTime: '08:00',
    closingTime: '17:00',
    counters: [
      { counterName: 'Pre-Op Screening Counter', isActive: true },
      { counterName: 'Cardiology Desk 1', isActive: true },
    ],
  },

  // --- 2. BANKS (5 Fictional Demonstration Locations) ---
  {
    name: 'First Metro Commercial Bank - Financial District (Demo)',
    category: LocationCategory.BANK,
    address: '200 Wall Street Plaza, Financial Core, ST 90211',
    latitude: 37.7915,
    longitude: -122.3999,
    openingTime: '09:00',
    closingTime: '17:00',
    counters: [
      { counterName: 'Teller Counter 1 - Cash & Deposits', isActive: true },
      { counterName: 'Teller Counter 2 - Cash & Deposits', isActive: true },
      { counterName: 'Teller Counter 3 - Commercial Accounts', isActive: true },
      { counterName: 'Customer Support & KYC Desk', isActive: true },
      { counterName: 'Loan & Mortgage Advisory Desk', isActive: false },
    ],
  },
  {
    name: 'Summit Trust & Savings - Downtown Branch (Demo)',
    category: LocationCategory.BANK,
    address: '740 Main Commerce Ave, Downtown, ST 90212',
    latitude: 37.7850,
    longitude: -122.4080,
    openingTime: '09:00',
    closingTime: '16:30',
    counters: [
      { counterName: 'Express Teller Counter 1', isActive: true },
      { counterName: 'Account Opening & Services Desk', isActive: true },
      { counterName: 'Forex & Wire Transfer Window', isActive: true },
    ],
  },
  {
    name: 'Horizon Community Credit Union (Demo)',
    category: LocationCategory.BANK,
    address: '1120 Oakwood Boulevard, Midtown, ST 90216',
    latitude: 37.7780,
    longitude: -122.4210,
    openingTime: '08:30',
    closingTime: '17:00',
    counters: [
      { counterName: 'Member Service Counter 1', isActive: true },
      { counterName: 'Member Service Counter 2', isActive: true },
      { counterName: 'Auto Loan Desk', isActive: true },
    ],
  },
  {
    name: 'Vanguard City Bank - Metro Center (Demo)',
    category: LocationCategory.BANK,
    address: '530 Lexington Corner, Central Plaza, ST 90218',
    latitude: 37.7700,
    longitude: -122.4100,
    openingTime: '09:00',
    closingTime: '17:00',
    counters: [
      { counterName: 'Teller Window A', isActive: true },
      { counterName: 'Teller Window B', isActive: true },
      { counterName: 'Wealth Management Reception', isActive: true },
    ],
  },
  {
    name: 'Sterling Mutual Bank & Treasury Desk (Demo)',
    category: LocationCategory.BANK,
    address: '900 Financial Hub Parkway, Gateway South, ST 90222',
    latitude: 37.7600,
    longitude: -122.4000,
    openingTime: '09:00',
    closingTime: '16:00',
    counters: [
      { counterName: 'Teller 1 - Priority Banking', isActive: true },
      { counterName: 'Teller 2 - Retail Operations', isActive: true },
      { counterName: 'Safe Deposit Box Access Desk', isActive: true },
    ],
  },

  // --- 3. GOVERNMENT OFFICES (5 Fictional Demonstration Locations) ---
  {
    name: 'Metro Department of Motor Vehicles (DMV) - West Hub (Demo)',
    category: LocationCategory.GOVERNMENT_OFFICE,
    address: '1450 Civic Center Drive, Westside, ST 90213',
    latitude: 37.7800,
    longitude: -122.4150,
    openingTime: '08:00',
    closingTime: '17:00',
    counters: [
      { counterName: "Driver's License Renewal Window 1", isActive: true },
      { counterName: "Driver's License Renewal Window 2", isActive: true },
      { counterName: 'Vehicle Registration & Titles Desk 3', isActive: true },
      { counterName: 'Commercial Driver (CDL) Desk 4', isActive: false },
      { counterName: 'Written & Vision Testing Desk 5', isActive: true },
    ],
  },
  {
    name: 'Central Passport & Visa Bureau (Demo)',
    category: LocationCategory.GOVERNMENT_OFFICE,
    address: '300 Federal Plaza, Suite 400, Government Quarter, ST 90214',
    latitude: 37.7820,
    longitude: -122.4180,
    openingTime: '08:30',
    closingTime: '16:00',
    counters: [
      { counterName: 'New Passport Application Window 1', isActive: true },
      { counterName: 'Expedited & Renewal Window 2', isActive: true },
      { counterName: 'Biometrics & Fingerprinting Counter', isActive: true },
    ],
  },
  {
    name: 'County Department of Revenue & Tax Administration (Demo)',
    category: LocationCategory.GOVERNMENT_OFFICE,
    address: '800 Municipal Way, Civic Complex, ST 90217',
    latitude: 37.7720,
    longitude: -122.4250,
    openingTime: '08:00',
    closingTime: '16:30',
    counters: [
      { counterName: 'Property Tax Inquiry Desk 1', isActive: true },
      { counterName: 'Business Licensing Counter 2', isActive: true },
      { counterName: 'Dispute Resolution & Hearings Desk', isActive: true },
    ],
  },
  {
    name: 'Municipal Vital Records & Licensing Center (Demo)',
    category: LocationCategory.GOVERNMENT_OFFICE,
    address: '220 City Hall Square, Historic District, ST 90219',
    latitude: 37.7790,
    longitude: -122.4190,
    openingTime: '09:00',
    closingTime: '16:30',
    counters: [
      { counterName: 'Birth & Marriage Certificates Window 1', isActive: true },
      { counterName: 'Public Notary & Legalizations Desk', isActive: true },
    ],
  },
  {
    name: 'State Social Security & Civic Affairs Office (Demo)',
    category: LocationCategory.GOVERNMENT_OFFICE,
    address: '610 Public Works Avenue, Eastside, ST 90221',
    latitude: 37.7680,
    longitude: -122.4350,
    openingTime: '08:30',
    closingTime: '16:00',
    counters: [
      { counterName: 'Benefit Claims Consultation Counter 1', isActive: true },
      { counterName: 'Benefit Claims Consultation Counter 2', isActive: true },
      { counterName: 'Card Replacement & Identity Verification', isActive: true },
    ],
  },
];

async function seed() {
  console.log('🌱 Starting QueuePulse AI database seeding...');

  // 1. Clean existing records safely
  console.log('🧹 Purging previous demo data...');
  await prisma.waitPrediction.deleteMany();
  await prisma.crowdReport.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.serviceCounter.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Demo Users
  console.log('👤 Seeding fictional demo users...');
  // Standard demo password 'QueuePulse2026!' cryptographically hashed with bcrypt
  const demoPasswordHash = await bcrypt.hash('QueuePulse2026!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin (Demo)',
      email: 'admin@queuepulse.demo',
      passwordHash: demoPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const staffHospital = await prisma.user.create({
    data: {
      name: 'Nurse Taylor Morgan (Demo)',
      email: 'nurse.morgan@hospital.demo',
      passwordHash: demoPasswordHash,
      role: UserRole.STAFF,
    },
  });

  const staffBank = await prisma.user.create({
    data: {
      name: 'Teller Alex Chen (Demo)',
      email: 'alex.chen@bank.demo',
      passwordHash: demoPasswordHash,
      role: UserRole.STAFF,
    },
  });

  const citizenUser1 = await prisma.user.create({
    data: {
      name: 'Jordan Miller (Demo Citizen)',
      email: 'jordan.miller@demo.local',
      passwordHash: demoPasswordHash,
      role: UserRole.USER,
    },
  });

  const citizenUser2 = await prisma.user.create({
    data: {
      name: 'Samira Patel (Demo Citizen)',
      email: 'samira.patel@demo.local',
      passwordHash: demoPasswordHash,
      role: UserRole.USER,
    },
  });

  const citizenUser3 = await prisma.user.create({
    data: {
      name: 'Carlos Gomez (Demo Citizen)',
      email: 'carlos.gomez@demo.local',
      passwordHash: demoPasswordHash,
      role: UserRole.USER,
    },
  });

  console.log(`✅ Seeded 6 demo users.`);

  // 3. Seed Demonstration Locations & Service Counters
  console.log(`📍 Seeding ${DEMO_LOCATIONS.length} realistic demonstration locations...`);

  let totalCounters = 0;
  let totalEntries = 0;

  for (const locData of DEMO_LOCATIONS) {
    const { counters, ...locFields } = locData;

    const location = await prisma.location.create({
      data: locFields,
    });

    // Create Service Counters
    const createdCounters = [];
    for (const c of counters) {
      const counter = await prisma.serviceCounter.create({
        data: {
          locationId: location.id,
          counterName: c.counterName,
          isActive: c.isActive,
        },
      });
      createdCounters.push(counter);
      totalCounters++;
    }

    // Seed Sample Queue Entries for each location
    const categoryPrefix =
      locData.category === LocationCategory.HOSPITAL ? 'HOSP' :
      locData.category === LocationCategory.BANK ? 'BANK' : 'GOV';

    const activeCounter = createdCounters.find(c => c.isActive) || createdCounters[0];

    // 1. A serving entry
    await prisma.queueEntry.create({
      data: {
        locationId: location.id,
        serviceCounterId: activeCounter.id,
        userId: citizenUser1.id,
        tokenNumber: `${categoryPrefix}-${Math.floor(100 + Math.random() * 900)}`,
        status: QueueStatus.SERVING,
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 min ago
        startedAt: new Date(Date.now() - 5 * 60 * 1000),  // 5 min ago
      },
    });
    totalEntries++;

    // 2. A waiting entry
    await prisma.queueEntry.create({
      data: {
        locationId: location.id,
        userId: citizenUser2.id,
        tokenNumber: `${categoryPrefix}-${Math.floor(100 + Math.random() * 900)}`,
        status: QueueStatus.WAITING,
        createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 min ago
      },
    });
    totalEntries++;

    // 3. Another waiting entry
    await prisma.queueEntry.create({
      data: {
        locationId: location.id,
        userId: citizenUser3.id,
        tokenNumber: `${categoryPrefix}-${Math.floor(100 + Math.random() * 900)}`,
        status: QueueStatus.WAITING,
        createdAt: new Date(Date.now() - 4 * 60 * 1000), // 4 min ago
      },
    });
    totalEntries++;

    // 4. A completed entry
    await prisma.queueEntry.create({
      data: {
        locationId: location.id,
        serviceCounterId: activeCounter.id,
        tokenNumber: `${categoryPrefix}-${Math.floor(100 + Math.random() * 900)}`,
        status: QueueStatus.COMPLETED,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 40 * 60 * 1000),
        completedAt: new Date(Date.now() - 28 * 60 * 1000),
      },
    });
    totalEntries++;

    // Crowd Report
    const crowdLevels = [CrowdLevel.LOW, CrowdLevel.MODERATE, CrowdLevel.HIGH];
    const pickedCrowd = crowdLevels[Math.floor(Math.random() * crowdLevels.length)];
    const peopleCount = pickedCrowd === CrowdLevel.LOW ? 8 : pickedCrowd === CrowdLevel.MODERATE ? 22 : 45;

    await prisma.crowdReport.create({
      data: {
        locationId: location.id,
        crowdLevel: pickedCrowd,
        peopleCount: peopleCount,
        reportedAt: new Date(Date.now() - 10 * 60 * 1000),
        verified: true,
      },
    });

    // Wait Prediction (Random Forest forecasted)
    const baseWait = pickedCrowd === CrowdLevel.LOW ? 6.5 : pickedCrowd === CrowdLevel.MODERATE ? 18.2 : 36.4;
    await prisma.waitPrediction.create({
      data: {
        locationId: location.id,
        predictedMinutes: parseFloat((baseWait + Math.random() * 3).toFixed(1)),
        confidenceLevel: 0.94,
        createdAt: new Date(),
      },
    });
  }

  console.log(`✅ Successfully seeded:`);
  console.log(`   - ${DEMO_LOCATIONS.length} Locations (6 Hospitals, 5 Banks, 5 Gov Offices)`);
  console.log(`   - ${totalCounters} Service Counters`);
  console.log(`   - ${totalEntries} Queue Entries`);
  console.log(`   - ${DEMO_LOCATIONS.length} Crowd Reports & Predictions`);
  console.log(`🔒 Note: All records are fictional demonstration fixtures. No real medical data is stored.`);
}

seed()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
