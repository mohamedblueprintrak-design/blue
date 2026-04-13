/**
 * Rate Limiter Module — Re-export from canonical implementation
 * وحدة تحديد معدل الطلبات — إعادة تصدير من التنفيذ الرئيسي
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

/**
 * Check rate limit for a request (convenience function)
 */
export async function checkRateLimit(request: NextRequest) {
  const ip = getClientIP(request.headers);
  const pathname = request.nextUrl?.pathname || '';

  let type: 'auth' | 'api' | 'strict' | 'passwordReset' | 'emailVerification' = 'api';
  if (pathname.includes('/api/auth/') || pathname.includes('/login')) {
    type = 'auth';
  } else if (pathname.includes('/forgot-password') || pathname.includes('/reset-password')) {
    type = 'passwordReset';
  } else if (pathname.includes('/verify-email') || pathname.includes('/resend-verification')) {
    type = 'emailVerification';
  }

  return rateLimiters[type].check(ip);
}

/**
 * Rate limit middleware wrapper (convenience function)
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

    return handler(request);
  };
}

/**
 * Singleton rate limiter instance (backward compat)
 */
export const rateLimiter = {
  getClientIP: (request: NextRequest) => getClientIP(request.headers),
  check: (ip: string, type: RateLimitType) => rateLimiters[type].check(ip),
  reset: (ip: string, type?: RateLimitType) => {
    const t = type || 'api';
    return rateLimiters[t].reset(ip);
  },
  detectType: (pathname: string): RateLimitType => {
    if (pathname.includes('/api/auth/') || pathname.includes('/login')) return 'auth';
    if (pathname.includes('/forgot-password') || pathname.includes('/reset-password')) return 'passwordReset';
    if (pathname.includes('/verify-email')) return 'emailVerification';
    return 'api';
  },
};
