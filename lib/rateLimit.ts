type Attempt = {
  count: number;
  firstAt: number;
  blockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

const store = new Map<string, Attempt>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Simple in-memory login rate limiter keyed by identifier (e.g. email+ip).
 * Good enough for a single-instance self-hosted deployment.
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (now - entry.firstAt > WINDOW_MS) {
    store.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    retryAfterSeconds: 0,
  };
}

export function registerFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    store.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }
  store.set(key, entry);
}

export function clearAttempts(key: string): void {
  store.delete(key);
}
