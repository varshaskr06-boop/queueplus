/**
 * QueuePulse AI - Fast Database Circuit Breaker for Hackathon Demo Resilience
 * Prevents 4-second TCP connection timeout penalties when PostgreSQL is offline.
 */
let isDbOffline = false;
let lastFailureTimestamp = 0;
const RETRY_INTERVAL_MS = 15000; // Retry live DB probe every 15 seconds

export function markDatabaseOffline() {
  isDbOffline = true;
  lastFailureTimestamp = Date.now();
}

export function markDatabaseOnline() {
  isDbOffline = false;
  lastFailureTimestamp = 0;
}

export function shouldAttemptDatabase() {
  if (!isDbOffline) return true;
  const elapsed = Date.now() - lastFailureTimestamp;
  if (elapsed > RETRY_INTERVAL_MS) {
    // Cooldown elapsed; attempt live connection again
    return true;
  }
  return false;
}
