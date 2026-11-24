import os from 'os';
import axios from 'axios';
import { config } from '../config/index.js';
import prisma from '../prisma/client.js';

export const getHealth = async (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());

  // Probe PostgreSQL Database status
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1;`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'offline_demo_fallback';
  }

  // Probe ML Service status
  let mlStatus = 'unreachable';
  let mlLatencyMs = null;
  const mlStart = Date.now();
  try {
    const mlRes = await axios.get(`${config.mlServiceUrl}/health`, { timeout: 1500 });
    if (mlRes.status === 200) {
      mlLatencyMs = Date.now() - mlStart;
      mlStatus = 'connected';
    }
  } catch (e) {
    mlStatus = 'offline_baseline_fallback';
  }

  res.status(200).json({
    status: 'ok',
    service: 'QueuePulse AI Backend',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    environment: config.nodeEnv,
    subsystems: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL',
      },
      mlEngine: {
        status: mlStatus,
        latencyMs: mlLatencyMs,
        url: config.mlServiceUrl,
        fallbackMode: 'QueuingTheoryBaseline',
      },
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    corsConfigured: true,
  });
};
