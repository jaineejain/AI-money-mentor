const buckets = new Map();

export function createRateLimiter({ windowMs, max, message }) {
  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.headers["x-forwarded-for"] || "unknown";
    const current = buckets.get(key);
    const bucket =
      !current || now >= current.resetAt
        ? { count: 0, resetAt: now + windowMs }
        : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > max) {
      response.setHeader(
        "Retry-After",
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      response.status(429).json({ detail: message });
      return;
    }
    next();
  };
}

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many requests. Please try again shortly.",
});

export const aiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many advisor requests. Please wait before trying again.",
});
