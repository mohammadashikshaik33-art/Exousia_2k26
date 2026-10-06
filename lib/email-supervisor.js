// Vercel Serverless API Library — EXOUSIA Production Self-Healing Email Supervisor & Circuit Breaker
// Path: lib/email-supervisor.js

// Initialize global state on globalThis to persist across warm serverless invocations
if (!globalThis.__EXOUSIA_EMAIL_SUPERVISOR__) {
  globalThis.__EXOUSIA_EMAIL_SUPERVISOR__ = {
    otpLastRequestedAt: 0,
    adminBulkPaused: false,
    queueState: 'IDLE', // 'IDLE' | 'PROCESSING' | 'PAUSED'
    lastSuccessfulSend: null,
    lastFailedSend: null,
    lastQueueRun: null,
    providers: {
      primary: {
        health: 'HEALTHY', // 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED'
        circuitState: 'CLOSED', // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
        consecutiveFailures: 0,
        lastFailureCategory: null,
        rateLimitedUntil: 0,
        lastSuccessAt: 0,
        lastFailureAt: 0,
        errorMessage: null
      },
      backup: {
        health: 'HEALTHY',
        circuitState: 'CLOSED',
        consecutiveFailures: 0,
        lastFailureCategory: null,
        rateLimitedUntil: 0,
        lastSuccessAt: 0,
        lastFailureAt: 0,
        errorMessage: null
      },
      resend: {
        health: 'HEALTHY',
        circuitState: 'CLOSED',
        consecutiveFailures: 0,
        lastFailureCategory: null,
        rateLimitedUntil: 0,
        lastSuccessAt: 0,
        lastFailureAt: 0,
        errorMessage: null
      }
    }
  };
}

const state = globalThis.__EXOUSIA_EMAIL_SUPERVISOR__;

/**
 * Categorize raw errors from email providers (Gmail API, Resend, HTTP responses).
 */
export function classifyProviderError(errorTxt, httpStatus = 0) {
  const err = String(errorTxt || '').toLowerCase();
  const status = Number(httpStatus) || 0;

  if (status === 429 || err.includes('ratelimitexceeded') || err.includes('resource_exhausted') || err.includes('user-rate limit exceeded')) {
    return 'RATE_LIMIT';
  }
  if (status === 401 || status === 403 || err.includes('invalid_client') || err.includes('invalid_grant') || err.includes('unauthorized') || err.includes('forbidden')) {
    return 'AUTH_FAILURE';
  }
  if (err.includes('validation_error') || err.includes('only send testing emails to your own email address') || err.includes('invalid email') || err.includes('recipient rejected')) {
    return 'INVALID_RECIPIENT';
  }
  if (err.includes('timeout') || err.includes('etimedout') || err.includes('econnreset') || err.includes('enotfound') || err.includes('fetch failed')) {
    return 'NETWORK_TIMEOUT';
  }
  if (status >= 500 && status < 600) {
    return 'TEMPORARY_PROVIDER_FAILURE';
  }
  if (status >= 400 && status < 500) {
    return 'PERMANENT_PROVIDER_FAILURE';
  }
  return 'UNKNOWN_PROVIDER_FAILURE';
}

/**
 * Record a send attempt result for a specific provider to manage circuit breaker state.
 */
export function recordProviderResult(providerName, success, errorCategory = null, rawErrorMessage = null, unlockTimestamp = 0) {
  const p = state.providers[providerName];
  if (!p) return;

  const now = Date.now();

  if (success) {
    p.consecutiveFailures = 0;
    p.lastSuccessAt = now;
    p.errorMessage = null;
    p.health = 'HEALTHY';
    p.circuitState = 'CLOSED';
    p.rateLimitedUntil = 0;
    state.lastSuccessfulSend = new Date(now).toISOString();
    return;
  }

  p.consecutiveFailures++;
  p.lastFailureAt = now;
  p.lastFailureCategory = errorCategory;
  p.errorMessage = rawErrorMessage;
  state.lastFailedSend = new Date(now).toISOString();

  if (errorCategory === 'RATE_LIMIT') {
    p.health = 'DEGRADED';
    p.circuitState = 'OPEN';
    const targetUnlock = unlockTimestamp > now ? unlockTimestamp : now + 15000;
    p.rateLimitedUntil = Math.min(now + (60 * 1000), targetUnlock); // Max 60 second rate limit cooldown
    console.warn(`[Supervisor Circuit OPEN] Provider '${providerName}' RATE_LIMITED until ${new Date(p.rateLimitedUntil).toISOString()}`);
  } else if (errorCategory === 'AUTH_FAILURE') {
    p.health = 'DEGRADED';
    p.circuitState = 'OPEN';
    p.rateLimitedUntil = now + (5 * 60 * 1000); // 5 min lock for auth check
    console.warn(`[Supervisor Circuit OPEN] Provider '${providerName}' AUTH_FAILURE detected.`);
  } else if (p.consecutiveFailures >= 3) {
    p.health = 'DEGRADED';
    p.circuitState = 'OPEN';
    p.rateLimitedUntil = now + (60 * 1000);
    console.warn(`[Supervisor Circuit DEGRADED] Provider '${providerName}' failed ${p.consecutiveFailures} consecutive times.`);
  }
}

/**
 * Reset all provider circuits to HEALTHY state for administrative recovery.
 */
export function resetProviderCircuits() {
  globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL = 0;
  Object.keys(state.providers).forEach(key => {
    state.providers[key].health = 'HEALTHY';
    state.providers[key].circuitState = 'CLOSED';
    state.providers[key].consecutiveFailures = 0;
    state.providers[key].rateLimitedUntil = 0;
    state.providers[key].errorMessage = null;
  });
  return getSystemHealthOverview();
}

/**
 * Check if OTP delivery is under pressure (within 15s of an OTP request).
 */
export function isOtpPressureActive() {
  return Date.now() - state.otpLastRequestedAt < 15000;
}

/**
 * Tag an OTP request event.
 */
export function markOtpRequested() {
  state.otpLastRequestedAt = Date.now();
  globalThis.__EXOUSIA_LAST_OTP_TIME = Date.now();
}

/**
 * Set queue processing state.
 */
export function setQueueState(qState) {
  state.queueState = qState;
  state.lastQueueRun = new Date().toISOString();
}

/**
 * Check whether lower-priority queues (P1 Confirmation, P2/P3 Apology) can process outbox items.
 */
export function canProcessOutboxQueue(priorityLevel = 'P1') {
  if (state.adminBulkPaused) {
    return { canProcess: false, reason: 'ADMIN_EMERGENCY_BULK_PAUSED' };
  }

  if (priorityLevel !== 'P0' && isOtpPressureActive()) {
    return { canProcess: false, reason: 'OTP_PRIORITY_PREEMPTION_ACTIVE' };
  }

  const now = Date.now();

  // Auto-transition expired OPEN locks to HALF_OPEN probe state
  Object.keys(state.providers).forEach(key => {
    const p = state.providers[key];
    if (p.circuitState === 'OPEN' && (p.rateLimitedUntil === 0 || now >= p.rateLimitedUntil)) {
      console.log(`[Supervisor Circuit Probe] Provider '${key}' transitioned from OPEN to HALF_OPEN probe state.`);
      p.circuitState = 'HALF_OPEN';
      p.health = 'DEGRADED';
      p.rateLimitedUntil = 0;
    }
  });

  const primaryAvail = state.providers.primary.circuitState !== 'OPEN' || (state.providers.primary.rateLimitedUntil > 0 && now >= state.providers.primary.rateLimitedUntil);
  const backupAvail = state.providers.backup.circuitState !== 'OPEN' || (state.providers.backup.rateLimitedUntil > 0 && now >= state.providers.backup.rateLimitedUntil);
  const resendAvail = state.providers.resend.circuitState !== 'OPEN' || (state.providers.resend.rateLimitedUntil > 0 && now >= state.providers.resend.rateLimitedUntil);

  if (!primaryAvail && !backupAvail && !resendAvail) {
    const remSec = Math.max(0, Math.ceil((state.providers.primary.rateLimitedUntil - now) / 1000));
    return { canProcess: false, reason: 'ALL_PROVIDERS_CIRCUIT_OPEN', remainingSec: remSec, rateLimitedUntil: new Date(state.providers.primary.rateLimitedUntil).toISOString() };
  }

  return { canProcess: true, reason: 'OK' };
}

/**
 * Calculate provider-aware exponential backoff delay with jitter.
 */
export function calculateExponentialBackoff(attemptNumber, baseMs = 1000, maxMs = 60000) {
  const attempt = Math.max(1, attemptNumber);
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt - 1));
  const jitter = Math.floor(Math.random() * (exponential * 0.3));
  return exponential + jitter;
}

/**
 * Toggle Admin Emergency Bulk Email Processing Pause.
 */
export function setAdminBulkPause(paused) {
  state.adminBulkPaused = Boolean(paused);
  if (paused) state.queueState = 'PAUSED';
  return state.adminBulkPaused;
}

function isProviderConfigured(key) {
  if (key === 'primary') {
    const t = (process.env.PRIMARY_GOOGLE_REFRESH_TOKEN || process.env.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN || '').trim();
    return Boolean(t && t.length > 20 && t !== '[Encrypted]');
  }
  if (key === 'backup') {
    const t = (process.env.BACKUP_GOOGLE_REFRESH_TOKEN || process.env.backup_google_refresh_token || process.env.BACKUP_REFRESH_TOKEN || '').trim();
    return Boolean(t && t.length > 20 && t !== '[Encrypted]');
  }
  if (key === 'resend') {
    const k = (process.env.RESEND_API_KEY || '').trim();
    return Boolean(k && k.length > 10 && k !== '[Encrypted]');
  }
  return false;
}

/**
 * Get full system email health overview for Admin panel inspection.
 */
export function getSystemHealthOverview() {
  const now = Date.now();
  
  // Refresh lock states if expired
  Object.keys(state.providers).forEach(key => {
    const p = state.providers[key];
    if (p.circuitState === 'OPEN' && p.rateLimitedUntil > 0 && now >= p.rateLimitedUntil) {
      p.circuitState = 'HALF_OPEN';
      p.health = 'DEGRADED';
    }
  });

  return {
    timestamp: new Date().toISOString(),
    adminBulkPaused: state.adminBulkPaused,
    queueState: state.adminBulkPaused ? 'PAUSED' : state.queueState,
    otpPressureActive: isOtpPressureActive(),
    lastSuccessfulSend: state.lastSuccessfulSend,
    lastFailedSend: state.lastFailedSend,
    lastQueueRun: state.lastQueueRun,
    providers: {
      primary: {
        health: isProviderConfigured('primary') ? state.providers.primary.health : 'NOT_CONFIGURED',
        circuitState: state.providers.primary.circuitState,
        rateLimitedUntil: state.providers.primary.rateLimitedUntil > 0 ? new Date(state.providers.primary.rateLimitedUntil).toISOString() : null,
        consecutiveFailures: state.providers.primary.consecutiveFailures,
        lastFailureCategory: state.providers.primary.lastFailureCategory,
        lastSuccessAt: state.providers.primary.lastSuccessAt > 0 ? new Date(state.providers.primary.lastSuccessAt).toISOString() : null,
        lastFailureAt: state.providers.primary.lastFailureAt > 0 ? new Date(state.providers.primary.lastFailureAt).toISOString() : null,
        errorMessage: state.providers.primary.errorMessage
      },
      backup: {
        health: isProviderConfigured('backup') ? state.providers.backup.health : 'NOT_CONFIGURED',
        circuitState: state.providers.backup.circuitState,
        rateLimitedUntil: state.providers.backup.rateLimitedUntil > 0 ? new Date(state.providers.backup.rateLimitedUntil).toISOString() : null,
        consecutiveFailures: state.providers.backup.consecutiveFailures,
        lastFailureCategory: state.providers.backup.lastFailureCategory,
        lastSuccessAt: state.providers.backup.lastSuccessAt > 0 ? new Date(state.providers.backup.lastSuccessAt).toISOString() : null,
        lastFailureAt: state.providers.backup.lastFailureAt > 0 ? new Date(state.providers.backup.lastFailureAt).toISOString() : null,
        errorMessage: state.providers.backup.errorMessage
      },
      resend: {
        health: isProviderConfigured('resend') ? state.providers.resend.health : 'NOT_CONFIGURED',
        circuitState: state.providers.resend.circuitState,
        rateLimitedUntil: state.providers.resend.rateLimitedUntil > 0 ? new Date(state.providers.resend.rateLimitedUntil).toISOString() : null,
        consecutiveFailures: state.providers.resend.consecutiveFailures,
        lastFailureCategory: state.providers.resend.lastFailureCategory,
        lastSuccessAt: state.providers.resend.lastSuccessAt > 0 ? new Date(state.providers.resend.lastSuccessAt).toISOString() : null,
        lastFailureAt: state.providers.resend.lastFailureAt > 0 ? new Date(state.providers.resend.lastFailureAt).toISOString() : null,
        errorMessage: state.providers.resend.errorMessage
      }
    }
  };
}

/**
 * Derive exact confirmation email state based on outbox row properties.
 */
export function deriveEmailDeliveryState(confItem) {
  if (!confItem) return 'CONFIRMATION_QUEUED';
  const st = (confItem.status || 'pending').toLowerCase();
  const err = (confItem.error_message || '').toLowerCase();

  if (st === 'sent') return 'CONFIRMATION_PROVIDER_ACCEPTED';
  if (st === 'sending') return 'CONFIRMATION_PROCESSING';
  if (st === 'dead_letter' || err.includes('invalid recipient') || err.includes('invalid email') || err.includes('permanent')) {
    return 'PERMANENT_FAILURE';
  }
  if (st === 'failed' || err.length > 0) return 'CONFIRMATION_RETRYING';
  return 'CONFIRMATION_QUEUED';
}

/**
 * Derive exact apology email state based on outbox row properties.
 */
export function deriveApologyDeliveryState(apologyItem) {
  if (!apologyItem) return 'NONE';
  const st = (apologyItem.status || '').toLowerCase();
  if (st === 'sent') return 'APOLOGY_SENT';
  if (st === 'pending' || st === 'sending') return 'APOLOGY_QUEUED';
  if (st === 'failed') return 'APOLOGY_FAILED';
  return 'NONE';
}


