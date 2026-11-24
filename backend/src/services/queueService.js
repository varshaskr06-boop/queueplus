import prisma from '../prisma/client.js';
import { demoStore } from '../data/demoStore.js';

export class QueueService {
  static async getLocationQueue(locationId) {
    try {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        include: {
          serviceCounters: {
            where: { isActive: true },
          },
        },
      });

      if (location) {
        const activeEntries = await prisma.queueEntry.findMany({
          where: {
            locationId,
            status: { in: ['WAITING', 'SERVING'] },
          },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true },
            },
            serviceCounter: {
              select: { id: true, counterName: true },
            },
          },
        });

        const waiting = activeEntries.filter((e) => e.status === 'WAITING');
        const serving = activeEntries.filter((e) => e.status === 'SERVING');

        const activeCountersCount = Math.max(1, location.serviceCounters.length);
        const avgMinutesPerCustomer = 8.0;
        const estimatedTotalWaitMinutes = Math.round(
          (waiting.length / activeCountersCount) * avgMinutesPerCustomer
        );

        return {
          location: {
            id: location.id,
            name: location.name,
            category: location.category,
          },
          stats: {
            waitingCount: waiting.length,
            servingCount: serving.length,
            activeCounters: activeCountersCount,
            estimatedAverageWaitMinutes: estimatedTotalWaitMinutes,
          },
          activeQueues: {
            serving,
            waiting,
          },
        };
      }
    } catch (dbErr) {
      // Demo Store Fallback
    }

    const demoLoc = demoStore.findLocationById(locationId);
    if (!demoLoc) {
      const err = new Error(`Location '${locationId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const allQueues = demoStore.getQueuesByLocation(locationId);
    const waiting = allQueues.filter((q) => q.status === 'WAITING');
    const serving = allQueues.filter((q) => q.status === 'SERVING');
    const activeCountersCount = demoLoc.activeCounterCount || 3;

    return {
      location: {
        id: demoLoc.id,
        name: demoLoc.name,
        category: demoLoc.category,
      },
      stats: {
        waitingCount: waiting.length,
        servingCount: serving.length,
        activeCounters: activeCountersCount,
        estimatedAverageWaitMinutes: Math.round((waiting.length / activeCountersCount) * 8.0) || 5,
      },
      activeQueues: {
        serving,
        waiting,
      },
    };
  }

  static async joinQueue({ locationId, userId, serviceCounterId }) {
    try {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (location) {
        const prefix =
          location.category === 'HOSPITAL' ? 'HOSP' :
          location.category === 'BANK' ? 'BANK' : 'GOV';

        const countToday = await prisma.queueEntry.count({
          where: {
            locationId,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        const tokenNumber = `${prefix}-${String(countToday + 1).padStart(3, '0')}`;

        const queueEntry = await prisma.queueEntry.create({
          data: {
            locationId,
            userId: userId || null,
            serviceCounterId: serviceCounterId || null,
            tokenNumber,
            status: 'WAITING',
          },
          include: {
            location: {
              select: { id: true, name: true, category: true },
            },
          },
        });

        const positionInQueue = await prisma.queueEntry.count({
          where: {
            locationId,
            status: 'WAITING',
            createdAt: { lte: queueEntry.createdAt },
          },
        });

        const activeCounters = await prisma.serviceCounter.count({
          where: { locationId, isActive: true },
        });

        const effectiveCounters = Math.max(1, activeCounters);
        const estimatedWaitMinutes = Math.round((positionInQueue / effectiveCounters) * 8.5);

        return {
          queueEntry,
          positionInQueue,
          estimatedWaitMinutes,
        };
      }
    } catch (dbErr) {
      // Demo Store Fallback
    }

    const demoLoc = demoStore.findLocationById(locationId);
    if (!demoLoc) {
      const err = new Error(`Location '${locationId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const queueEntry = demoStore.joinQueue({ locationId, userId });
    return {
      queueEntry,
      positionInQueue: 1,
      estimatedWaitMinutes: 8,
    };
  }

  static async updateQueueStatus({ id, status, serviceCounterId, user }) {
    // Role-based authorization & administrative check:
    if (user.role === 'USER') {
      if (status !== 'CANCELLED') {
        const err = new Error('Forbidden: Users are not permitted to perform administrative queue actions (only CANCELLED status is allowed for customers)');
        err.statusCode = 403;
        throw err;
      }
    }

    try {
      const queueEntry = await prisma.queueEntry.findUnique({
        where: { id },
        include: { location: true },
      });

      if (queueEntry) {
        if (user.role === 'USER' && queueEntry.userId !== user.id) {
          const err = new Error('Access denied: You are not authorized to modify another user\'s queue ticket');
          err.statusCode = 403;
          throw err;
        }

        const updateData = { status };
        if (serviceCounterId) updateData.serviceCounterId = serviceCounterId;
        if (status === 'SERVING' && !queueEntry.startedAt) {
          updateData.startedAt = new Date();
        } else if (status === 'COMPLETED' && !queueEntry.completedAt) {
          updateData.completedAt = new Date();
          if (!queueEntry.startedAt) updateData.startedAt = new Date();
        }

        const updated = await prisma.queueEntry.update({
          where: { id },
          data: updateData,
          include: {
            location: {
              select: { id: true, name: true },
            },
            serviceCounter: {
              select: { id: true, counterName: true },
            },
          },
        });

        return updated;
      }
    } catch (dbErr) {
      if (dbErr.statusCode === 403) throw dbErr;
      // Demo Store Fallback
    }

    const updated = demoStore.updateQueueStatus(id, status);
    if (!updated) {
      const err = new Error(`Queue ticket with ID '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return updated;
  }
}
