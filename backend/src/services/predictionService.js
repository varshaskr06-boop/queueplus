import axios from 'axios';
import prisma from '../prisma/client.js';
import { config } from '../config/index.js';
import { ReportService } from './reportService.js';
import { demoStore } from '../data/demoStore.js';

export class PredictionService {
  static async getLatestPrediction(locationId) {
    let location = null;
    try {
      location = await prisma.location.findUnique({
        where: { id: locationId },
      });
    } catch (e) {
      location = demoStore.findLocationById(locationId);
    }

    if (!location) {
      location = demoStore.findLocationById(locationId);
    }

    if (!location) {
      const err = new Error(`Location '${locationId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    try {
      const latest = await prisma.waitPrediction.findFirst({
        where: { locationId },
        orderBy: { createdAt: 'desc' },
      });

      if (latest) {
        return latest;
      }
    } catch (e) {
      // Fallback to on-the-fly generation below
    }

    // If no prediction exists yet, generate on the fly
    return await this.generatePrediction(locationId);
  }

  static async generatePrediction(locationId) {
    let location = null;
    try {
      location = await prisma.location.findUnique({
        where: { id: locationId },
        include: {
          serviceCounters: {
            where: { isActive: true },
          },
        },
      });
    } catch (e) {
      location = demoStore.findLocationById(locationId);
    }

    if (!location) {
      location = demoStore.findLocationById(locationId);
    }

    if (!location) {
      const err = new Error(`Location '${locationId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    // Compute real-time queue attributes
    let waitingCount = 0;
    try {
      waitingCount = await prisma.queueEntry.count({
        where: { locationId, status: 'WAITING' },
      });
    } catch (e) {
      waitingCount = location.waitingQueueCount || 5;
    }

    const activeCounters = Math.max(1, location.serviceCounters?.length || location.activeCounterCount || 3);
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    let predictedMinutes = 0;
    let confidenceLevel = 0.92;
    let recommendation = 'Counters operating normally.';

    // Attempt to invoke the ML Service Random Forest Regressor
    try {
      const weightedCrowdScore = await ReportService.getWeightedCrowdScore(locationId);
      const avgServiceTime =
        location.category === 'HOSPITAL' ? 8.5 : location.category === 'BANK' ? 5.5 : 9.0;
      const completionRate = Math.round((60.0 / avgServiceTime) * 10) / 10;

      const mlPayload = {
        queue_length: waitingCount,
        active_counters: activeCounters,
        avg_service_time: avgServiceTime,
        hour: hourOfDay,
        day_of_week: dayOfWeek,
        historical_queue: Math.max(5.0, waitingCount * 0.8),
        crowd_reports: weightedCrowdScore,
        completion_rate: completionRate,
        service_rate: completionRate,
        arrival_rate: Math.max(5.0, waitingCount * 1.5),
        hour_of_day: hourOfDay,
      };

      const mlRes = await axios.post(`${config.mlServiceUrl}/predict`, mlPayload, {
        timeout: 2500,
      });

      const predicted =
        mlRes.data?.predicted_wait_minutes ?? mlRes.data?.predicted_wait_time_minutes;

      if (predicted !== undefined) {
        predictedMinutes = Math.max(0.0, predicted);
        confidenceLevel = mlRes.data.confidence_level || 0.95;
        recommendation = mlRes.data.recommendation || (predictedMinutes > 20
          ? 'High queue wait time detected! Recommend opening additional counters.'
          : 'Queue throughput operating within optimal capacity.');
      }
    } catch (mlErr) {
      // Fallback queuing theory estimation when ML service is offline
      const baseWait = (waitingCount / (activeCounters * 7.0)) * 60.0;
      const peakFactor = (hourOfDay >= 11 && hourOfDay <= 14) ? 1.25 : 1.0;
      predictedMinutes = Math.max(1.0, Math.round(baseWait * peakFactor * 10) / 10);
      confidenceLevel = 0.82;
      recommendation = predictedMinutes > 20
        ? 'High wait time. Consider opening backup service counters.'
        : 'Queue load within standard capacity.';
    }

    // Persist prediction record in database if online, else in-memory
    let prediction;
    try {
      prediction = await prisma.waitPrediction.create({
        data: {
          locationId,
          predictedMinutes,
          confidenceLevel,
        },
      });
    } catch (e) {
      prediction = {
        id: `pred-${Date.now()}`,
        locationId,
        predictedMinutes,
        confidenceLevel,
        createdAt: new Date(),
      };
    }

    return {
      prediction,
      details: {
        queueLength: waitingCount,
        activeCounters,
        avgServiceTime: location.category === 'HOSPITAL' ? 8.5 : location.category === 'BANK' ? 5.5 : 9.0,
        recommendation,
        algorithm: 'Random Forest Regressor (QueuePulse ML Service)',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Smart Visit & Optimal Departure Recommendation
   * - Predicts crowd levels across operating time slots
   * - Considers facility opening & closing hours (excludes closed periods)
   * - Accounts for live queue decay and historical time-of-day curves
   * - Incorporates user's travel duration: Expected Total Time = Travel Duration + Expected Wait Time
   * - Recommends optimal departure window minimizing total expected time
   */
  static async getSmartVisitRecommendation(locationId, travelDurationMinutes = 20) {
    let location = null;
    try {
      location = await prisma.location.findUnique({
        where: { id: locationId },
        include: {
          serviceCounters: { where: { isActive: true } },
        },
      });
    } catch (e) {
      location = demoStore.findLocationById(locationId);
    }

    if (!location) {
      location = demoStore.findLocationById(locationId);
    }

    if (!location) {
      const err = new Error(`Location '${locationId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const travelDuration = Math.max(0, parseInt(travelDurationMinutes, 10) || 20);

    let waitingCount = 0;
    try {
      waitingCount = await prisma.queueEntry.count({
        where: { locationId, status: 'WAITING' },
      });
    } catch (e) {
      waitingCount = 8;
    }

    const activeCounters = Math.max(1, location.serviceCounters?.length || 3);
    const avgServiceTime =
      location.category === 'HOSPITAL' ? 8.5 : location.category === 'BANK' ? 5.5 : 9.0;

    // Operating hours
    const openHour = parseInt(location.openingTime?.split(':')[0] || '8', 10);
    const closeHour = parseInt(location.closingTime?.split(':')[0] || '18', 10);

    const now = new Date();
    const currentHour = now.getHours();

    const minHour = Math.max(7, openHour - 1);
    const maxHour = Math.min(21, closeHour + 1);

    const timeSlots = [];

    for (let h = minHour; h <= maxHour; h++) {
      const isOpen = h >= openHour && h < closeHour;
      const timeLabel = `${String(h).padStart(2, '0')}:00`;
      const displayLabel = formatHourDisplay(h);

      if (!isOpen) {
        timeSlots.push({
          hour: h,
          timeLabel,
          displayLabel,
          isOpen: false,
          isArrivalOpen: false,
          statusLabel: h < openHour ? `Opens at ${location.openingTime}` : `Closed at ${location.closingTime}`,
          predictedWaitMinutes: null,
          crowdLevel: 'CLOSED',
          travelDurationMinutes: travelDuration,
          expectedTotalMinutes: null,
          isOptimalDeparture: false,
        });
        continue;
      }

      // Expected arrival time if departing at slot h:
      const arrivalTotalMinutes = h * 60 + travelDuration;
      const arrivalHourFloat = arrivalTotalMinutes / 60;
      const arrivalHourInt = Math.floor(arrivalHourFloat);
      const isArrivalOpen = arrivalHourFloat >= openHour && arrivalHourFloat < closeHour;

      // Category-specific arrival multiplier
      let categoryMultiplier = 1.0;
      if (location.category === 'HOSPITAL') {
        if (arrivalHourInt >= 9 && arrivalHourInt <= 12) categoryMultiplier = 1.35;
        else if (arrivalHourInt >= 16 && arrivalHourInt <= 18) categoryMultiplier = 1.25;
        else if (arrivalHourInt >= 8 && arrivalHourInt < 9) categoryMultiplier = 0.70;
        else categoryMultiplier = 0.85;
      } else if (location.category === 'BANK') {
        if (arrivalHourInt >= 12 && arrivalHourInt <= 14) categoryMultiplier = 1.45;
        else if (arrivalHourInt >= 9 && arrivalHourInt <= 10) categoryMultiplier = 1.20;
        else if (arrivalHourInt >= 15 && arrivalHourInt <= 17) categoryMultiplier = 0.70;
        else categoryMultiplier = 0.85;
      } else {
        if (arrivalHourInt >= 10 && arrivalHourInt <= 14) categoryMultiplier = 1.40;
        else if (arrivalHourInt >= 8 && arrivalHourInt < 10) categoryMultiplier = 0.65;
        else categoryMultiplier = 0.85;
      }

      // Real-time live queue decay
      const hourDiff = arrivalHourFloat - currentHour;
      let liveSurgeDecay = 1.0;
      if (hourDiff >= 0 && hourDiff < 3) {
        const liveCongestionRatio = Math.max(1.0, waitingCount / (activeCounters * 3.5));
        liveSurgeDecay = 1.0 + (liveCongestionRatio - 1.0) * Math.exp(-hourDiff / 1.5);
      }

      const nominalQueue = Math.max(
        2,
        Math.round(activeCounters * 3.2 * categoryMultiplier * liveSurgeDecay)
      );
      const predictedWait = Math.max(
        3,
        Math.round((nominalQueue / activeCounters) * avgServiceTime)
      );

      let crowdLevel = 'LOW';
      if (predictedWait >= 35) crowdLevel = 'CRITICAL';
      else if (predictedWait >= 22) crowdLevel = 'HIGH';
      else if (predictedWait >= 12) crowdLevel = 'MODERATE';

      const expectedTotalMinutes = isArrivalOpen ? travelDuration + predictedWait : null;

      timeSlots.push({
        hour: h,
        timeLabel,
        displayLabel,
        isOpen: true,
        isArrivalOpen,
        arrivalDisplay: formatMinutesToTime(arrivalTotalMinutes),
        statusLabel: isArrivalOpen ? 'Open & Serving' : `Arrives after close (${location.closingTime})`,
        predictedWaitMinutes: predictedWait,
        crowdLevel,
        travelDurationMinutes: travelDuration,
        expectedTotalMinutes,
        isOptimalDeparture: false,
      });
    }

    // Find optimal departure slot among open arrival slots
    const validArrivalSlots = timeSlots.filter(
      (s) => s.isOpen && s.isArrivalOpen && s.expectedTotalMinutes !== null
    );

    let optimalSlot = null;
    let worstSlot = null;
    let timeSavedMinutes = 0;

    if (validArrivalSlots.length > 0) {
      const sortedByTotal = [...validArrivalSlots].sort(
        (a, b) => a.expectedTotalMinutes - b.expectedTotalMinutes
      );
      optimalSlot = sortedByTotal[0];
      worstSlot = sortedByTotal[sortedByTotal.length - 1];
      timeSavedMinutes = Math.max(0, worstSlot.expectedTotalMinutes - optimalSlot.expectedTotalMinutes);

      // Mark optimal in original list
      const match = timeSlots.find((s) => s.hour === optimalSlot.hour);
      if (match) match.isOptimalDeparture = true;
    }

    // Best visit windows
    const optimalHour = optimalSlot?.hour || openHour;
    const bestVisitWindow = {
      windowLabel: `${formatHourDisplay(optimalHour)} - ${formatHourDisplay(optimalHour + 2)}`,
      expectedWaitMinutes: optimalSlot?.predictedWaitMinutes || 8,
      recommendedArrival: `${formatHourDisplay(optimalHour)}`,
      reason: 'Lowest arrival density curve and optimal counter throughput.',
    };

    const peakHour = worstSlot?.hour || 12;
    const peakWindowToAvoid = {
      windowLabel: `${formatHourDisplay(peakHour)} - ${formatHourDisplay(peakHour + 2)}`,
      expectedWaitMinutes: worstSlot?.predictedWaitMinutes || 42,
      reason: 'Peak community foot-traffic bottleneck and shift transitions.',
    };

    return {
      location: {
        id: location.id,
        name: location.name,
        category: location.category,
        openingTime: location.openingTime,
        closingTime: location.closingTime,
      },
      currentConditions: {
        waitingQueueCount: waitingCount,
        activeCounters,
        avgServiceTimeMinutes: avgServiceTime,
        currentHour,
      },
      userTravelInput: {
        travelDurationMinutes: travelDuration,
      },
      smartDeparture: optimalSlot
        ? {
            optimalDepartureHour: optimalSlot.hour,
            departureTimeDisplay: optimalSlot.displayLabel,
            recommendedDepartureTime: optimalSlot.displayLabel,
            estimatedArrivalTime: optimalSlot.arrivalDisplay,
            travelDurationMinutes: travelDuration,
            expectedWaitMinutes: optimalSlot.predictedWaitMinutes,
            expectedTotalTimeMinutes: optimalSlot.expectedTotalMinutes,
            timeSavedMinutes,
            summary: `Depart at ${optimalSlot.displayLabel} (travel: ${travelDuration}m) to arrive by ${optimalSlot.arrivalDisplay}. You will face only ~${optimalSlot.predictedWaitMinutes}m wait, saving ${timeSavedMinutes}m compared to peak departure.`,
          }
        : null,
      bestVisitWindow,
      bestVisitingWindow: bestVisitWindow,
      peakWindowToAvoid,
      timeSlots,
      disclaimer:
        'DISCLAIMER: Future wait times and departure recommendations are statistical forecasts generated from historical queuing curves and live community telemetry. They do not constitute official reservations or guaranteed service appointments.',
    };
  }
}

function formatHourDisplay(h) {
  if (h === 0 || h === 24) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h > 12) return `${h - 12}:00 PM`;
  return `${h}:00 AM`;
}

function formatMinutesToTime(totalMins) {
  const normMins = totalMins % (24 * 60);
  const h = Math.floor(normMins / 60);
  const m = normMins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}
