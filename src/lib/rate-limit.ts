export interface RateLimitStore {
  attempts: Map<string, { count: number; resetAt: number }>;
  maxAttempts: number;
  windowMs: number;
}

export function createRateLimiter(
  maxAttempts: number,
  windowMs: number,
): RateLimitStore {
  return {
    attempts: new Map(),
    maxAttempts,
    windowMs,
  };
}

export function isRateLimited(store: RateLimitStore, key: string): boolean {
  const now = Date.now();
  const record = store.attempts.get(key);

  if (!record || now > record.resetAt) {
    store.attempts.set(key, { count: 1, resetAt: now + store.windowMs });
    return false;
  }

  record.count++;
  return record.count > store.maxAttempts;
}
