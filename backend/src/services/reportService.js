import prisma from '../prisma/client.js';
import { demoStore } from '../data/demoStore.js';

// In-memory sliding window for rate-limiting submissions (3 min cooldown per user/IP per location)
const recentSubmissions = new Map();

// In-memory fallback report store when database is offline
const fallbackReports = new Map();

export class ReportService {
  /**
   * Submit crowd observation with rate-limiting, suspicious report detection,
   * verification logic, and privacy protection.
   */
  static async createReport({
    locationId,
    crowdLevel,
    peopleCount,
    observedWaitMinutes,
    notes,
    user,
    clientIp,
  }) {
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

    const identifier = user?.id || clientIp || 'anonymous_client';
    const rateKey = `${identifier}:${locationId}`;
    const now = Date.now();

    // 1. Rate Limiting & Cooldown Check (3 minutes between submissions per location)
    // Staff & Admins bypass submission frequency limits for rapid operational calibration
    const isStaffOrAdmin = user && (user.role === 'STAFF' || user.role === 'ADMIN');
    if (!isStaffOrAdmin && recentSubmissions.has(rateKey)) {
      const lastTime = recentSubmissions.get(rateKey);
      const elapsedMinutes = (now - lastTime) / (60 * 1000);
      if (elapsedMinutes < 3.0) {
        const remainingSeconds = Math.ceil((3.0 - elapsedMinutes) * 60);
        const err = new Error(
          `Rate limit exceeded: You have recently submitted an observation for this location. Please wait ${remainingSeconds} seconds before posting an update.`
        );
        err.statusCode = 429;
        throw err;
      }
    }

    // 2. Suspicious Report & Contradiction Detection
    let isSuspicious = false;
    let suspicionReason = null;

    if (crowdLevel === 'LOW' && peopleCount > 80) {
      isSuspicious = true;
      suspicionReason = 'High people count contradicts reported LOW crowd level';
    } else if ((crowdLevel === 'CRITICAL' || crowdLevel === 'HIGH') && peopleCount < 3) {
      isSuspicious = true;
      suspicionReason = 'Very low people count contradicts reported peak/critical congestion';
    }

    // 3. Verification Mechanism
    // - Verified if author is STAFF or ADMIN
    // - Auto-verified if corroborating existing fresh consensus
    let verified = Boolean(isStaffOrAdmin);

    if (!verified && !isSuspicious) {
      // Check if recent fresh reports from others already corroborated this crowd level
      try {
        const recentSameLevel = await prisma.crowdReport.count({
          where: {
            locationId,
            crowdLevel,
            reportedAt: { gte: new Date(now - 45 * 60 * 1000) },
          },
        });
        if (recentSameLevel >= 2) {
          verified = true; // Corroborated by 2+ peers
        }
      } catch (e) {
        // Fallback store check
        const stored = fallbackReports.get(locationId) || [];
        const peers = stored.filter(
          (r) => r.crowdLevel === crowdLevel && (now - new Date(r.reportedAt).getTime()) < 45 * 60 * 1000
        );
        if (peers.length >= 2) verified = true;
      }
    }

    // Update cooldown timestamp
    recentSubmissions.set(rateKey, now);

    // Clean up old cooldown records periodically
    if (recentSubmissions.size > 2000) {
      for (const [key, timestamp] of recentSubmissions.entries()) {
        if (now - timestamp > 10 * 60 * 1000) {
          recentSubmissions.delete(key);
        }
      }
    }

    // 4. Save to Database
    let report;
    try {
      report = await prisma.crowdReport.create({
        data: {
          locationId,
          crowdLevel,
          peopleCount,
          verified,
        },
        include: {
          location: {
            select: { id: true, name: true, category: true },
          },
        },
      });
    } catch (dbErr) {
      // Memory fallback for resilience
      report = {
        id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        locationId,
        crowdLevel,
        peopleCount,
        verified,
        reportedAt: new Date(),
        location: {
          id: location.id,
          name: location.name,
          category: location.category,
        },
      };

      const existing = fallbackReports.get(locationId) || [];
      fallbackReports.set(locationId, [report, ...existing]);
    }

    // Return sanitized report (Never expose reporter ID or private info)
    return {
      id: report.id,
      locationId: report.locationId,
      crowdLevel: report.crowdLevel,
      peopleCount: report.peopleCount,
      observedWaitMinutes: observedWaitMinutes || null,
      verified: report.verified,
      isSuspicious,
      suspicionReason,
      reportedAt: report.reportedAt,
      location: report.location,
    };
  }

  /**
   * Retrieve crowd reports for a facility with:
   * - Strict stale report exclusion (> 120 mins)
   * - Weighted crowd estimate computation with exponential time decay
   * - Conflicting observation detection
   * - Privacy anonymization (zero PII exposure)
   * - Comparative queue distinction
   */
  static async getReportsByLocation(locationId, limit = 20) {
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

    const take = Math.min(50, Math.max(1, parseInt(limit, 10)));
    let allReports = [];

    try {
      allReports = await prisma.crowdReport.findMany({
        where: { locationId },
        orderBy: { reportedAt: 'desc' },
        take,
      });
    } catch (e) {
      allReports = fallbackReports.get(locationId) || [];
    }

    // Also get actual official queue count from database
    let officialWaitingTickets = 0;
    try {
      officialWaitingTickets = await prisma.queueEntry.count({
        where: { locationId, status: 'WAITING' },
      });
    } catch (e) {
      officialWaitingTickets = 0;
    }

    const now = Date.now();
    const STALE_THRESHOLD_MINUTES = 120; // 2 hours

    // Level numeric values: LOW=1, MODERATE=2, HIGH=3, CRITICAL=4
    const levelMap = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
    const reverseLevelMap = { 1: 'LOW', 2: 'MODERATE', 3: 'HIGH', 4: 'CRITICAL' };

    // Process reports, categorize freshness, and anonymize
    const processedReports = allReports.map((r, index) => {
      const reportTime = new Date(r.reportedAt).getTime();
      const ageMinutes = Math.max(0, Math.round((now - reportTime) / (60 * 1000)));

      let freshness = 'FRESH';
      if (ageMinutes > STALE_THRESHOLD_MINUTES) {
        freshness = 'STALE';
      } else if (ageMinutes > 60) {
        freshness = 'EXPIRING';
      }

      // Privacy Anonymization: Never expose email, real name, or user IDs
      let reporterBadge = 'Community Observer';
      if (r.verified) {
        reporterBadge = 'Verified Telemetry';
      } else if (ageMinutes <= 15) {
        reporterBadge = 'Recent On-site Visitor';
      }

      return {
        id: r.id,
        crowdLevel: r.crowdLevel,
        peopleCount: r.peopleCount,
        reportedAt: r.reportedAt,
        ageMinutes,
        freshness,
        verified: Boolean(r.verified),
        reporterBadge,
      };
    });

    // Rule 10: Exclude stale reports (> 120 mins) from current crowd calculations
    const activeFreshReports = processedReports.filter((r) => r.freshness !== 'STALE');

    // Rule 5: Calculate Weighted Crowd Estimate
    let totalWeight = 0;
    let weightedScoreSum = 0;
    let weightedPeopleSum = 0;
    const activeScores = [];

    activeFreshReports.forEach((r) => {
      // Exponential time decay: weight halves roughly every 35 minutes
      const timeDecay = Math.exp(-r.ageMinutes / 35.0);
      // Verification bonus (2x weight for verified entries)
      const verifyBonus = r.verified ? 2.0 : 1.0;
      const weight = timeDecay * verifyBonus;

      const score = levelMap[r.crowdLevel] || 1;
      activeScores.push({ score, ageMinutes: r.ageMinutes });

      totalWeight += weight;
      weightedScoreSum += score * weight;
      weightedPeopleSum += r.peopleCount * weight;
    });

    let weightedCrowdScore = 1.0;
    let weightedCrowdLevel = 'LOW';
    let weightedPeopleCount = 0;

    if (totalWeight > 0) {
      weightedCrowdScore = weightedScoreSum / totalWeight;
      weightedPeopleCount = Math.round(weightedPeopleSum / totalWeight);

      if (weightedCrowdScore < 1.6) {
        weightedCrowdLevel = 'LOW';
      } else if (weightedCrowdScore < 2.5) {
        weightedCrowdLevel = 'MODERATE';
      } else if (weightedCrowdScore < 3.4) {
        weightedCrowdLevel = 'HIGH';
      } else {
        weightedCrowdLevel = 'CRITICAL';
      }
    } else {
      // Fallback if no fresh reports exist within 2 hours
      weightedCrowdScore = officialWaitingTickets > 20 ? 3.0 : officialWaitingTickets > 8 ? 2.0 : 1.0;
      weightedCrowdLevel = reverseLevelMap[Math.round(weightedCrowdScore)];
      weightedPeopleCount = Math.round(officialWaitingTickets * 1.2);
    }

    // Rule 8: Detect and flag conflicting observations among recent reports (<= 45 mins)
    const recentScores = activeScores
      .filter((s) => s.ageMinutes <= 45)
      .map((s) => s.score);

    let hasConflictingReports = false;
    let conflictNotice = null;

    if (recentScores.length >= 2) {
      const minScore = Math.min(...recentScores);
      const maxScore = Math.max(...recentScores);
      // Divergence >= 2 levels (e.g. LOW vs HIGH or CRITICAL)
      if (maxScore - minScore >= 2) {
        hasConflictingReports = true;
        conflictNotice =
          'Conflicting observations detected between recent visitors (e.g. Low vs. High). Time-decay weighted average has been applied to smooth discrepancies.';
      }
    }

    // Most recent report timestamp
    const lastReport = processedReports[0];
    const lastUpdated = lastReport ? lastReport.reportedAt : location.createdAt;

    return {
      locationId,
      locationName: location.name,
      // Weighted Community Consensus
      weightedCrowdEstimate: {
        crowdLevel: weightedCrowdLevel,
        crowdScore: roundNumber(weightedCrowdScore, 2),
        estimatedPeopleCount: weightedPeopleCount,
        activeReportsCount: activeFreshReports.length,
        hasConflictingReports,
        conflictNotice,
        lastUpdated,
      },
      // Clear distinction between official queue tokens vs community observations
      systemDelineation: {
        officialWaitingTickets,
        communityEstimatedPeople: weightedPeopleCount,
        explanation:
          'Official queue tokens represent active booked places in line, while community reports represent visual lobby foot-traffic.',
      },
      // Historical & recent reports list (fully anonymized)
      recentReportsCount: activeFreshReports.length,
      totalHistoricalReports: allReports.length,
      lastUpdated,
      recentReports: processedReports,
    };
  }

  /**
   * Helper for prediction engine: returns numeric crowd score (1.0 to 4.0)
   */
  static async getWeightedCrowdScore(locationId) {
    try {
      const data = await this.getReportsByLocation(locationId, 10);
      return data.weightedCrowdEstimate?.crowdScore || 2.0;
    } catch (e) {
      return 2.0;
    }
  }
}

function roundNumber(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
