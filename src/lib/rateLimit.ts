type LimitConfig = {
  max: number;
  windowMs: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request): string {
  const h = (name: string) => req.headers.get(name) || "";
  const forwarded = h("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h("cf-connecting-ip") || h("x-real-ip") || "unknown";
}

export async function checkAndConsumeRateLimit(subject: string, scope: string, config: LimitConfig) {
  const key = `${scope}:${subject}`;
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: new Date(now + config.windowMs) };
  }
  if (bucket.count < config.max) {
    bucket.count += 1;
    memoryBuckets.set(key, bucket);
    return { allowed: true, remaining: config.max - bucket.count, resetAt: new Date(bucket.resetAt) };
  }
  return { allowed: false, remaining: 0, resetAt: new Date(bucket.resetAt) };
}

export const RATE_LIMITS = {
  anonymous: {
    generate: { max: 30, windowMs: 60 * 60 * 1000 },
    edit: { max: 30, windowMs: 60 * 60 * 1000 },
  },
  authenticated: {
    generate: { max: 200, windowMs: 24 * 60 * 60 * 1000 },
    edit: { max: 200, windowMs: 24 * 60 * 60 * 1000 },
  },
} as const;