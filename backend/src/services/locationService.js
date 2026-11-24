import prisma from '../prisma/client.js';
import { calculateDistanceKm } from '../utils/distance.js';
import { demoStore } from '../data/demoStore.js';
import { markDatabaseOffline, markDatabaseOnline, shouldAttemptDatabase } from '../utils/dbStatus.js';

export class LocationService {
  static async getLocations({ category, search, page = 1, limit = 20 }) {
    if (shouldAttemptDatabase()) {
      try {
        const where = {};

        if (category && category !== 'ALL') {
          where.category = category;
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ];
        }

        const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
        const take = parseInt(limit, 10);

        const [locations, total] = await Promise.all([
          prisma.location.findMany({
            where,
            skip,
            take,
            include: {
              serviceCounters: {
                select: { id: true, counterName: true, isActive: true },
              },
              crowdReports: {
                orderBy: { reportedAt: 'desc' },
                take: 1,
              },
              waitPredictions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              _count: {
                select: {
                  queueEntries: {
                    where: { status: 'WAITING' },
                  },
                },
              },
            },
            orderBy: { name: 'asc' },
          }),
          prisma.location.count({ where }),
        ]);

        markDatabaseOnline();
        return {
          locations: locations.map((loc) => {
            const waitingCount = loc._count.queueEntries;
            const activeCounters = loc.serviceCounters.filter((c) => c.isActive).length;
            const avgServiceMins = loc.category === 'HOSPITAL' ? 8.5 : loc.category === 'BANK' ? 5.5 : 9.0;
            const predMins = loc.waitPredictions[0]?.predictedMinutes || Math.round((waitingCount / Math.max(1, activeCounters)) * avgServiceMins);
            
            let crowdLevel = loc.crowdReports[0]?.crowdLevel;
            if (!crowdLevel) {
              crowdLevel = waitingCount >= 25 ? 'CRITICAL' : waitingCount >= 15 ? 'HIGH' : waitingCount >= 8 ? 'MODERATE' : 'LOW';
            }

            return {
              ...loc,
              waitingQueueCount: waitingCount,
              activeCounterCount: activeCounters,
              totalCounterCount: loc.serviceCounters.length,
              crowdLevel,
              estimatedWaitMinutes: predMins,
              averageServiceTimeMinutes: avgServiceMins,
              lastUpdated: loc.crowdReports[0]?.reportedAt || loc.updatedAt || loc.createdAt,
            };
          }),
          pagination: {
            total,
            page: parseInt(page, 10),
            limit: take,
            totalPages: Math.ceil(total / take),
          },
        };
      } catch (dbErr) {
        markDatabaseOffline();
      }
    }

    // In-Memory Demo Fallback Mode
    let list = demoStore.getLocations();
    if (category && category !== 'ALL') {
      list = list.filter((l) => l.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
      );
    }
    return {
      locations: list,
      pagination: {
        total: list.length,
        page: 1,
        limit: parseInt(limit, 10) || 20,
        totalPages: 1,
      },
    };
  }

  static async getLocationById(id) {
    if (shouldAttemptDatabase()) {
      try {
        const location = await prisma.location.findUnique({
          where: { id },
          include: {
            serviceCounters: {
              orderBy: { counterName: 'asc' },
            },
            crowdReports: {
              orderBy: { reportedAt: 'desc' },
              take: 3,
            },
            waitPredictions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: {
                queueEntries: {
                  where: { status: 'WAITING' },
                },
              },
            },
          },
        });

        if (location) {
          markDatabaseOnline();
          const waitingCount = location._count.queueEntries;
          const activeCounters = location.serviceCounters.filter((c) => c.isActive).length;
          const avgServiceMins = location.category === 'HOSPITAL' ? 8.5 : location.category === 'BANK' ? 5.5 : 9.0;
          const predMins = location.waitPredictions[0]?.predictedMinutes || Math.round((waitingCount / Math.max(1, activeCounters)) * avgServiceMins);
          let crowdLevel = location.crowdReports[0]?.crowdLevel;
          if (!crowdLevel) {
            crowdLevel = waitingCount >= 25 ? 'CRITICAL' : waitingCount >= 15 ? 'HIGH' : waitingCount >= 8 ? 'MODERATE' : 'LOW';
          }

          return {
            ...location,
            currentWaitingCount: waitingCount,
            waitingQueueCount: waitingCount,
            activeCounterCount: activeCounters,
            totalCounterCount: location.serviceCounters.length,
            crowdLevel,
            estimatedWaitMinutes: predMins,
            averageServiceTimeMinutes: avgServiceMins,
            lastUpdated: location.crowdReports[0]?.reportedAt || location.createdAt,
            latestPrediction: location.waitPredictions[0] || null,
          };
        }
      } catch (dbErr) {
        markDatabaseOffline();
      }
    }

    const demoLoc = demoStore.findLocationById(id);
    if (!demoLoc) {
      const err = new Error(`Location with ID '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    return {
      ...demoLoc,
      currentWaitingCount: demoLoc.waitingQueueCount || 0,
      totalCounterCount: demoLoc.serviceCounters ? demoLoc.serviceCounters.length : 3,
      lastUpdated: new Date().toISOString(),
      latestPrediction: { predictedMinutes: demoLoc.estimatedWaitMinutes || 12, confidenceLevel: 0.93 },
    };
  }

  static async getNearbyLocations({ lat, lng, radius = 15 }) {
    if (shouldAttemptDatabase()) {
      try {
        const allLocations = await prisma.location.findMany({
          include: {
            serviceCounters: true,
            crowdReports: {
              orderBy: { reportedAt: 'desc' },
              take: 1,
            },
            waitPredictions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: {
                queueEntries: {
                  where: { status: 'WAITING' },
                },
              },
            },
          },
        });

        if (allLocations && allLocations.length > 0) {
          markDatabaseOnline();
          const nearby = allLocations
            .map((loc) => {
              const distanceKm = calculateDistanceKm(lat, lng, loc.latitude, loc.longitude);
              const waitingCount = loc._count.queueEntries;
              const activeCounters = loc.serviceCounters.filter((c) => c.isActive).length;
              const avgServiceMins = loc.category === 'HOSPITAL' ? 8.5 : loc.category === 'BANK' ? 5.5 : 9.0;
              const predMins = loc.waitPredictions[0]?.predictedMinutes || Math.round((waitingCount / Math.max(1, activeCounters)) * avgServiceMins);
              
              let crowdLevel = loc.crowdReports[0]?.crowdLevel;
              if (!crowdLevel) {
                crowdLevel = waitingCount >= 25 ? 'CRITICAL' : waitingCount >= 15 ? 'HIGH' : waitingCount >= 8 ? 'MODERATE' : 'LOW';
              }

              return {
                ...loc,
                distanceKm,
                currentWaitingCount: waitingCount,
                waitingQueueCount: waitingCount,
                activeCounterCount: activeCounters,
                totalCounterCount: loc.serviceCounters.length,
                crowdLevel,
                estimatedWaitMinutes: predMins,
                averageServiceTimeMinutes: avgServiceMins,
                lastUpdated: loc.crowdReports[0]?.reportedAt || loc.createdAt,
              };
            })
            .filter((loc) => loc.distanceKm <= radius)
            .sort((a, b) => a.distanceKm - b.distanceKm);

          return nearby;
        }
      } catch (dbErr) {
        markDatabaseOffline();
      }
    }

    return demoStore
      .getLocations()
      .map((loc) => {
        const distanceKm = calculateDistanceKm(lat, lng, loc.latitude, loc.longitude);
        return {
          ...loc,
          distanceKm,
          currentWaitingCount: loc.waitingQueueCount || 0,
          totalCounterCount: loc.serviceCounters ? loc.serviceCounters.length : 3,
        };
      })
      .filter((loc) => loc.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
}
