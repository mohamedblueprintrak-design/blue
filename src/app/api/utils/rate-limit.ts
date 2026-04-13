/**
 * Rate Limiting Utility — Re-export from canonical implementation
 * أداة تحديد معدل الطلبات — إعادة تصدير من التنفيذ الرئيسي
 *
 * This file has been consolidated. All rate limiting logic now lives in
 * @/lib/rate-limiter.ts. This file re-exports the same API for backward
 * compatibility with any existing imports.
 */

export {
  RateLimiter,
  rateLimiters,
  getClientIP,
  createRateLimitResponse,
  getRedisRateLimiter,
} from '@/lib/rate-limiter';

export type { RateLimitConfig, RateLimitResult } from '@/lib/rate-limiter';

// Re-export convenience wrappers that match the old API
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';

export type RateLimitType = 'auth' | 'api' | 'strict' | 'passwordReset' | 'emailVerification';

const RATE_LIMIT_CONFIGS = {
  auth: { maxRequests: 10, windowMs: 60000 },
  api: { maxRequests: 100, windowMs: 60000 },
  public: { maxRequests: 200, windowMs: 60000 },
};

/**
 * Check rate limit for a request (sync version for backward compat)
 */
export function checkRateLimit(request: NextRequest) {
  const ip = getClientIP(request.headers);
  const pathname = request.nextUrl?.pathname || '';

  let type: 'auth' | 'api' | 'strict' | 'passwordReset' | 'emailVerification' = 'api';
  if (pathname.includes('/api/auth/') || pathname.includes('/login')) {
    type = 'auth';
  }

  // For sync contexts, return a basic result and let async callers use the full version
  return rateLimiters[type].check(ip);
}

/**
 * Async version that properly uses Redis
 */
export async function checkRateLimitByTypeAsync(
  ip: string,
  type: RateLimitType = 'api'
) {
  return rateLimiters[type].check(ip);
}

/**
 * Check rate limit by IP and type (sync fallback)
 */
export function checkRateLimitByType(
  ip: string,
  type: RateLimitType = 'api'
) {
  return rateLimiters[type].check(ip);
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type?: RateLimitType
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(request.headers);
    const pathname = request.nextUrl?.pathname || '';

    const limitType = type || (
      pathname.includes('/api/auth/') || pathname.includes('/login') ? 'auth' :
      pathname.includes('/forgot-password') || pathname.includes('/reset-password') ? 'passwordReset' :
      'api'
    );

    const result = await rateLimiters[limitType].check(ip);

    if (!result.allowed) {
      const response = createRateLimitResponse(result, limitType);
      return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    const response = await handler(request);
    return response;
  };
}

/**
 * Create rate limit error response
 */
export function rateLimitError(
  resetTime: number,
  type: RateLimitType = 'api',
  language: 'ar' | 'en' = 'ar'
): NextResponse {
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: language === 'ar' ? 'تم تجاوز الحد المسموح' : 'Rate limit exceeded' } },
    { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Reset': resetTime.toString() } }
  );
}

/**
 * Get rate limit configuration
 */
export function getRateLimitConfig() {
  return { maxRequests: RATE_LIMIT_CONFIGS.api.maxRequests, windowMs: RATE_LIMIT_CONFIGS.api.windowMs };
}

/**
 * Get all rate limit configurations
 */
export function getAllRateLimitConfigs() {
  return RATE_LIMIT_CONFIGS;
}

/**
 * Reset rate limit for a specific IP (admin only)
 */
export async function resetRateLimit(ip: string, type?: RateLimitType) {
  const t = type || 'api';
  await rateLimiters[t].reset(ip);
}

/**
 * Get rate limit stats (admin only)
 */
export function getRateLimitStats() {
  return {
    totalEntries: 0,
    entriesByType: { auth: 0, api: 0, public: 0 },
    usingRedis: !!process.env.REDIS_URL,
  };
}

/**
 * Detect rate limit type based on request path
 */
export function detectRateLimitType(pathname: string): RateLimitType {
  if (pathname.includes('/api/auth/') || pathname.includes('/login')) return 'auth';
  if (pathname.includes('/api/health') || pathname.includes('/api/public')) return 'api';
  return 'api';
}
