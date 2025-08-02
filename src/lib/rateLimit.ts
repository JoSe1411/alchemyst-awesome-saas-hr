import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a Redis instance from environment variables (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
const redis = Redis.fromEnv();

// Configure a simple fixed-window limiter (e.g. 60 requests per 60 seconds per IP)
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, '1 m'),
  analytics: true,
});

export interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
}

/**
 * Enforce a per-IP rate limit for Next.js API routes.
 * Returns `{ allowed: true }` if the request is under the limit; otherwise
 * `{ allowed: false, response }` where `response` is a pre-built 429 response.
 */
export async function enforceRateLimit(req: NextRequest): Promise<RateLimitResult> {
  try {
    // Prefer standard headers set by Vercel/NGINX/etc.
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null) ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      const res = NextResponse.json(
        {
          error: 'Too many requests',
          limit,
          remaining,
          reset,
        },
        { status: 429, headers: { 'Retry-After': reset.toString() } }
      );
      return { allowed: false, response: res };
    }

    return { allowed: true };
  } catch (error) {
    // Fail-open on rate-limiter errors to avoid blocking legitimate traffic
    console.warn('Rate limiter error:', error);
    return { allowed: true };
  }
} 