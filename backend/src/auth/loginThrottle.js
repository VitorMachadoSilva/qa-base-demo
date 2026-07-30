const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

function cleanExpired(now) {
  for (const [key, entry] of attempts) {
    if (entry.windowEndsAt <= now && entry.blockedUntil <= now) {
      attempts.delete(key);
    }
  }
}

export function loginAttemptKey(req, email) {
  const address = req.ip || req.socket?.remoteAddress || 'local';
  return `${address}:${String(email).trim().toLowerCase()}`;
}

export function isLoginBlocked(key, now = Date.now()) {
  cleanExpired(now);
  return (attempts.get(key)?.blockedUntil || 0) > now;
}

export function registerLoginFailure(key, now = Date.now()) {
  const current = attempts.get(key);
  const inWindow = current && current.windowEndsAt > now;
  const count = inWindow ? current.count + 1 : 1;
  const windowEndsAt = inWindow ? current.windowEndsAt : now + WINDOW_MS;
  const blockedUntil = count >= MAX_FAILURES ? windowEndsAt : 0;

  attempts.set(key, {
    count,
    windowEndsAt,
    blockedUntil
  });

  return count >= MAX_FAILURES;
}

export function clearLoginFailures(key) {
  attempts.delete(key);
}

export const loginThrottleInternals = {
  attempts,
  MAX_FAILURES,
  WINDOW_MS
};
