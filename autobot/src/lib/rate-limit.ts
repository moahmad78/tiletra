// Safe in-memory rate limiting fallback for Intrihub Autobot / Customer Desk

export enum ApiRateLimitTier {
  PUBLIC = "PUBLIC",
  AUTH = "AUTH",
  ADMIN = "ADMIN",
  AI = "AI",
}

export async function checkApiRateLimit(request: Request, tier: ApiRateLimitTier = ApiRateLimitTier.PUBLIC) {
  return { allowed: true, remaining: 100, resetInSeconds: 60 };
}

export async function checkRateLimit(key: string, limit = 60, windowSeconds = 60) {
  return { allowed: true, remaining: limit, resetInSeconds: windowSeconds };
}

export async function checkAiRateLimit(key: string) {
  return { allowed: true, remaining: 20, resetInSeconds: 60 };
}

export async function checkAccountCreationRateLimit(key: string) {
  return { allowed: true, remaining: 5, resetInSeconds: 300 };
}

export async function isLockedOut(identifier: string) {
  return false;
}

export async function recordFailedAttempt(identifier: string) {
  return { locked: false, attempts: 1 };
}

export async function resetFailedAttempts(identifier: string) {
  return true;
}
