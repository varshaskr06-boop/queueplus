import bcrypt from 'bcryptjs';

// Pre-hashed demo password for 'QueuePulse2026!' and 'Password123!'
const DEMO_PASSWORD = 'QueuePulse2026!';
const DEMO_PASSWORD_ALT = 'Password123!';
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

export const DEMO_USERS = [
  {
    id: 'u-admin-1',
    name: 'System Admin (Demo)',
    email: 'admin@queuepulse.demo',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'ADMIN',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'u-user-1',
    name: 'Jordan Miller (Demo Citizen)',
    email: 'jordan.miller@demo.local',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'USER',
    createdAt: new Date('2026-01-10T00:00:00.000Z'),
  },
  {
    id: 'u-staff-1',
    name: 'Nurse Taylor Morgan (Demo)',
    email: 'nurse.morgan@hospital.demo',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'STAFF',
    createdAt: new Date('2026-01-05T00:00:00.000Z'),
  },
];

export const DEMO_LOCATIONS = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Metro Central General Hospital (Demo Facility)',
    category: 'HOSPITAL',
    address: '100 Health Sciences Blvd, Metro City, ST 90210',
    latitude: 37.7749,
    longitude: -122.4194,
    openingTime: '00:00',
    closingTime: '23:59',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-h1-1', counterName: 'Triage Desk 1 - Adult Care', isActive: true },
      { id: 'c-h1-2', counterName: 'Triage Desk 2 - Rapid Assessment', isActive: true },
      { id: 'c-h1-3', counterName: 'Outpatient Registration Window A', isActive: true },
      { id: 'c-h1-4', counterName: 'Outpatient Registration Window B', isActive: false },
      { id: 'c-h1-5', counterName: 'Diagnostic & Lab Check-in', isActive: true },
    ],
    waitingQueueCount: 7,
    activeCounterCount: 4,
    estimatedWaitMinutes: 18,
    averageServiceTimeMinutes: 8.5,
    crowdLevel: 'MODERATE',
  },
  {
    id: 'loc-hosp-2',
    name: 'St. Luke Memorial Healthcare Center (Demo Facility)',
    category: 'HOSPITAL',
    address: '450 Medical Arts Parkway, East District, ST 90215',
    latitude: 37.7833,
    longitude: -122.4167,
    openingTime: '06:00',
    closingTime: '22:00',
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-h2-1', counterName: 'Admissions Desk 1', isActive: true },
      { id: 'c-h2-2', counterName: 'Radiology & Imaging Reception', isActive: true },
      { id: 'c-h2-3', counterName: 'General Consultation Desk', isActive: true },
    ],
    waitingQueueCount: 4,
    activeCounterCount: 3,
    estimatedWaitMinutes: 11,
    averageServiceTimeMinutes: 8.5,
    crowdLevel: 'LOW',
  },
  {
    id: 'loc-hosp-3',
    name: 'Pine Valley Regional Trauma & Urgent Care (Demo Facility)',
    category: 'HOSPITAL',
    address: '820 Evergreen Way, North Valley, ST 90220',
    latitude: 37.7900,
    longitude: -122.4050,
    openingTime: '07:00',
    closingTime: '23:00',
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-h3-1', counterName: 'Urgent Care Intake 1', isActive: true },
      { id: 'c-h3-2', counterName: 'Urgent Care Intake 2', isActive: true },
      { id: 'c-h3-3', counterName: 'Pediatric Check-in', isActive: true },
    ],
    waitingQueueCount: 14,
    activeCounterCount: 3,
    estimatedWaitMinutes: 38,
    averageServiceTimeMinutes: 9.0,
    crowdLevel: 'HIGH',
  },
  {
    id: 'loc-bank-1',
    name: 'First Metro Commercial Bank - Financial District (Demo)',
    category: 'BANK',
    address: '200 Wall Street Plaza, Financial Core, ST 90211',
    latitude: 37.7915,
    longitude: -122.3999,
    openingTime: '09:00',
    closingTime: '17:00',
    createdAt: new Date('2026-01-04T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-b1-1', counterName: 'Teller Counter 1 - Cash & Deposits', isActive: true },
      { id: 'c-b1-2', counterName: 'Teller Counter 2 - Cash & Deposits', isActive: true },
      { id: 'c-b1-3', counterName: 'Customer Support & KYC Desk', isActive: true },
    ],
    waitingQueueCount: 6,
    activeCounterCount: 3,
    estimatedWaitMinutes: 12,
    averageServiceTimeMinutes: 5.5,
    crowdLevel: 'MODERATE',
  },
  {
    id: 'loc-bank-2',
    name: 'Summit Trust & Savings - Downtown Branch (Demo)',
    category: 'BANK',
    address: '740 Main Commerce Ave, Downtown, ST 90212',
    latitude: 37.7850,
    longitude: -122.4080,
    openingTime: '09:00',
    closingTime: '16:30',
    createdAt: new Date('2026-01-05T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-b2-1', counterName: 'Express Teller Counter 1', isActive: true },
      { id: 'c-b2-2', counterName: 'Account Opening & Services Desk', isActive: true },
    ],
    waitingQueueCount: 2,
    activeCounterCount: 2,
    estimatedWaitMinutes: 5,
    averageServiceTimeMinutes: 5.0,
    crowdLevel: 'LOW',
  },
  {
    id: 'loc-gov-1',
    name: 'Central Department of Motor Vehicles (DMV Demo Hub)',
    category: 'GOVERNMENT_OFFICE',
    address: '1350 Civic Center Drive, Government Plaza, ST 90213',
    latitude: 37.7785,
    longitude: -122.4175,
    openingTime: '08:00',
    closingTime: '17:00',
    createdAt: new Date('2026-01-06T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-g1-1', counterName: 'Driver License Renewals Window 1', isActive: true },
      { id: 'c-g1-2', counterName: 'Driver License Renewals Window 2', isActive: true },
      { id: 'c-g1-3', counterName: 'Vehicle Registration Window A', isActive: true },
      { id: 'c-g1-4', counterName: 'REAL ID Verification Desk', isActive: true },
    ],
    waitingQueueCount: 22,
    activeCounterCount: 4,
    estimatedWaitMinutes: 48,
    averageServiceTimeMinutes: 9.5,
    crowdLevel: 'CRITICAL',
  },
  {
    id: 'loc-gov-2',
    name: 'City Hall Municipal Services & Vital Records (Demo)',
    category: 'GOVERNMENT_OFFICE',
    address: '1 Dr. Carlton B. Goodlett Place, Room 100, ST 90214',
    latitude: 37.7792,
    longitude: -122.4191,
    openingTime: '08:00',
    closingTime: '16:30',
    createdAt: new Date('2026-01-07T00:00:00.000Z'),
    serviceCounters: [
      { id: 'c-g2-1', counterName: 'Birth & Marriage Certificates Window', isActive: true },
      { id: 'c-g2-2', counterName: 'Property Tax & Assessment Counter', isActive: true },
    ],
    waitingQueueCount: 5,
    activeCounterCount: 2,
    estimatedWaitMinutes: 14,
    averageServiceTimeMinutes: 8.0,
    crowdLevel: 'LOW',
  },
];

// In-Memory state for reliable zero-DB demo resilience
class DemoStore {
  constructor() {
    this.users = [...DEMO_USERS];
    this.locations = [...DEMO_LOCATIONS];
    this.queues = [
      {
        id: 'q-demo-1',
        userId: 'u-user-1',
        locationId: '33333333-3333-4333-8333-333333333333',
        tokenNumber: 'HOSP-042',
        status: 'WAITING',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        startedAt: null,
        completedAt: null,
        user: { id: 'u-user-1', name: 'Jordan Miller (Demo Citizen)' },
      },
      {
        id: 'q-demo-2',
        userId: 'u-user-1',
        locationId: 'loc-gov-1',
        tokenNumber: 'GOV-108',
        status: 'SERVING',
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
        startedAt: new Date(Date.now() - 5 * 60 * 1000),
        completedAt: null,
        user: { id: 'u-user-1', name: 'Jordan Miller (Demo Citizen)' },
        counterName: 'Driver License Renewals Window 1',
      },
    ];
    this.reports = [
      {
        id: 'rep-demo-1',
        locationId: '33333333-3333-4333-8333-333333333333',
        crowdLevel: 'MODERATE',
        peopleCount: 18,
        reportedAt: new Date(Date.now() - 20 * 60 * 1000),
        verified: true,
        reporterBadge: 'Verified Telemetry',
      },
    ];
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(userData) {
    const user = {
      id: `u-${Date.now()}`,
      ...userData,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  verifyPassword(candidate, hash) {
    if (candidate === DEMO_PASSWORD || candidate === DEMO_PASSWORD_ALT) return true;
    return bcrypt.compareSync(candidate, hash);
  }

  getLocations() {
    return this.locations;
  }

  findLocationById(id) {
    return this.locations.find((l) => l.id === id);
  }

  addLocation(locData) {
    const loc = {
      id: `loc-${Date.now()}`,
      ...locData,
      createdAt: new Date(),
      serviceCounters: (locData.counters || ['Counter 1', 'Counter 2']).map((c, idx) => ({
        id: `cnt-${Date.now()}-${idx}`,
        counterName: typeof c === 'string' ? c : c.counterName,
        isActive: true,
      })),
      waitingQueueCount: 0,
      activeCounterCount: locData.counters ? locData.counters.length : 2,
      estimatedWaitMinutes: 5,
      crowdLevel: 'LOW',
    };
    this.locations.push(loc);
    return loc;
  }

  updateLocation(id, updates) {
    const loc = this.findLocationById(id);
    if (!loc) return null;
    Object.assign(loc, updates);
    return loc;
  }

  addCounter(locationId, counterName) {
    const loc = this.findLocationById(locationId);
    if (!loc) return null;
    const counter = {
      id: `cnt-${Date.now()}`,
      counterName,
      isActive: true,
    };
    loc.serviceCounters.push(counter);
    loc.activeCounterCount = loc.serviceCounters.filter((c) => c.isActive).length;
    return counter;
  }

  toggleCounter(counterId, isActive) {
    for (const loc of this.locations) {
      const counter = loc.serviceCounters?.find((c) => c.id === counterId);
      if (counter) {
        counter.isActive = isActive;
        loc.activeCounterCount = loc.serviceCounters.filter((c) => c.isActive).length;
        return counter;
      }
    }
    return null;
  }

  getQueuesByLocation(locationId) {
    return this.queues.filter((q) => q.locationId === locationId);
  }

  joinQueue({ locationId, userId, tokenNumber }) {
    const loc = this.findLocationById(locationId);
    const prefix = loc?.category === 'HOSPITAL' ? 'HOSP' : loc?.category === 'BANK' ? 'BANK' : 'GOV';
    const entry = {
      id: `q-${Date.now()}`,
      locationId,
      userId: userId || 'anonymous',
      tokenNumber: tokenNumber || `${prefix}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'WAITING',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      location: loc,
      user: { name: 'Demo Citizen' },
    };
    this.queues.push(entry);
    if (loc) {
      loc.waitingQueueCount = (loc.waitingQueueCount || 0) + 1;
    }
    return entry;
  }

  updateQueueStatus(queueId, status) {
    const q = this.queues.find((item) => item.id === queueId);
    if (!q) return null;
    q.status = status;
    if (status === 'SERVING') q.startedAt = new Date();
    if (status === 'COMPLETED') q.completedAt = new Date();
    return q;
  }

  addReport(reportData) {
    const report = {
      id: `rep-${Date.now()}`,
      ...reportData,
      reportedAt: new Date(),
      verified: true,
      reporterBadge: 'Community Observer',
    };
    this.reports.unshift(report);
    return report;
  }

  getReports(locationId) {
    return this.reports.filter((r) => r.locationId === locationId);
  }

  verifyReport(reportId, verified) {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.verified = verified;
      return rep;
    }
    return { id: reportId, verified };
  }
}

export const demoStore = new DemoStore();
