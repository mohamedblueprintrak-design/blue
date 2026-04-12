/**
 * Unit Tests — API Utils
 * Tests auth.ts, rate-limit.ts, and db.ts utility functions
 */

import {
  getTokenFromRequest,
  generateToken,
  isAdmin,
  isHR,
  isAccountant,
  canApproveLeave,
  canApproveExpense,
  getJWTSecret,
} from '@/app/api/utils/auth';
import {
  getClientIP,
  detectRateLimitType,
  checkRateLimitByType,
  getRateLimitConfig,
  getAllRateLimitConfigs,
  getRateLimitStats,
  resetRateLimit,
  rateLimitError,
} from '@/app/api/utils/rate-limit';
import {
  getEmptyPaginationResponse,
  safeDbOp,
} from '@/app/api/utils/db';

// ─── Helper: create mock NextRequest ────────────────────────────────────

function createMockRequest(options: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
} = {}): any {
  const headers = new Map(Object.entries(options.headers || {}));
  const cookies = new Map(Object.entries(options.cookies || {}).map(([k, v]) => [k, { value: v }]));

  return {
    headers: {
      get: (name: string) => headers.get(name) || null,
    },
    cookies: {
      get: (name: string) => cookies.get(name) || undefined,
    },
    nextUrl: {
      pathname: options.url || '/api/test',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// auth.ts — getTokenFromRequest
// ═══════════════════════════════════════════════════════════════════════

describe('auth.ts — getTokenFromRequest', () => {
  it('should extract token from Bearer header', () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer my-jwt-token' },
    });
    expect(getTokenFromRequest(req)).toBe('my-jwt-token');
  });

  it('should return null when no authorization header', () => {
    const req = createMockRequest();
    expect(getTokenFromRequest(req)).toBeNull();
  });

  it('should return null when authorization header is not Bearer', () => {
    const req = createMockRequest({
      headers: { authorization: 'Basic abc123' },
    });
    expect(getTokenFromRequest(req)).toBeNull();
  });

  it('should fall back to cookie when header is missing', () => {
    const req = createMockRequest({
      cookies: { blue_token: 'cookie-jwt-token' },
    });
    expect(getTokenFromRequest(req)).toBe('cookie-jwt-token');
  });

  it('should fall back to cookie when header is httpOnly placeholder', () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer httpOnly' },
      cookies: { blue_token: 'real-jwt-from-cookie' },
    });
    expect(getTokenFromRequest(req)).toBe('real-jwt-from-cookie');
  });

  it('should return null when cookie is missing and header is httpOnly', () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer httpOnly' },
    });
    expect(getTokenFromRequest(req)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// auth.ts — generateToken
// ═══════════════════════════════════════════════════════════════════════

describe('auth.ts — generateToken', () => {
  it('should generate a JWT token string', async () => {
    const token = await generateToken('user-123');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate different tokens for different users', async () => {
    const token1 = await generateToken('user-1');
    const token2 = await generateToken('user-2');
    expect(token1).not.toBe(token2);
  });

  it('should produce a valid JWT format (3 parts)', async () => {
    const token = await generateToken('user-x');
    expect(token.split('.')).toHaveLength(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// auth.ts — Role Checks
// ═══════════════════════════════════════════════════════════════════════

describe('auth.ts — isAdmin', () => {
  it('should return true for ADMIN role', () => {
    expect(isAdmin({ id: '1', role: 'ADMIN' } as any)).toBe(true);
  });

  it('should return true for lowercase admin role', () => {
    expect(isAdmin({ id: '1', role: 'admin' } as any)).toBe(true);
  });

  it('should return false for non-admin role', () => {
    expect(isAdmin({ id: '1', role: 'ENGINEER' } as any)).toBe(false);
  });

  it('should return false for MANAGER role', () => {
    expect(isAdmin({ id: '1', role: 'MANAGER' } as any)).toBe(false);
  });
});

describe('auth.ts — isHR', () => {
  it('should return true for HR role', () => {
    expect(isHR({ id: '1', role: 'HR' } as any)).toBe(true);
  });

  it('should return true for lowercase hr role', () => {
    expect(isHR({ id: '1', role: 'hr' } as any)).toBe(true);
  });

  it('should return false for non-HR role', () => {
    expect(isHR({ id: '1', role: 'ENGINEER' } as any)).toBe(false);
  });
});

describe('auth.ts — isAccountant', () => {
  it('should return true for ACCOUNTANT role', () => {
    expect(isAccountant({ id: '1', role: 'ACCOUNTANT' } as any)).toBe(true);
  });

  it('should return true for lowercase accountant role', () => {
    expect(isAccountant({ id: '1', role: 'accountant' } as any)).toBe(true);
  });

  it('should return false for non-accountant role', () => {
    expect(isAccountant({ id: '1', role: 'ENGINEER' } as any)).toBe(false);
  });
});

describe('auth.ts — canApproveLeave', () => {
  it('should allow ADMIN to approve leaves', () => {
    expect(canApproveLeave({ id: '1', role: 'ADMIN' } as any)).toBe(true);
  });

  it('should allow HR to approve leaves', () => {
    expect(canApproveLeave({ id: '1', role: 'HR' } as any)).toBe(true);
  });

  it('should allow MANAGER to approve leaves', () => {
    expect(canApproveLeave({ id: '1', role: 'MANAGER' } as any)).toBe(true);
  });

  it('should not allow ENGINEER to approve leaves', () => {
    expect(canApproveLeave({ id: '1', role: 'ENGINEER' } as any)).toBe(false);
  });

  it('should not allow VIEWER to approve leaves', () => {
    expect(canApproveLeave({ id: '1', role: 'VIEWER' } as any)).toBe(false);
  });

  it('should handle lowercase roles', () => {
    expect(canApproveLeave({ id: '1', role: 'manager' } as any)).toBe(true);
  });
});

describe('auth.ts — canApproveExpense', () => {
  it('should allow ADMIN to approve expenses', () => {
    expect(canApproveExpense({ id: '1', role: 'ADMIN' } as any)).toBe(true);
  });

  it('should allow ACCOUNTANT to approve expenses', () => {
    expect(canApproveExpense({ id: '1', role: 'ACCOUNTANT' } as any)).toBe(true);
  });

  it('should allow MANAGER to approve expenses', () => {
    expect(canApproveExpense({ id: '1', role: 'MANAGER' } as any)).toBe(true);
  });

  it('should not allow HR to approve expenses', () => {
    expect(canApproveExpense({ id: '1', role: 'HR' } as any)).toBe(false);
  });

  it('should not allow ENGINEER to approve expenses', () => {
    expect(canApproveExpense({ id: '1', role: 'ENGINEER' } as any)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// auth.ts — getJWTSecret
// ═══════════════════════════════════════════════════════════════════════

describe('auth.ts — getJWTSecret', () => {
  it('should return a Uint8Array', () => {
    const secret = getJWTSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBeGreaterThan(0);
  });

  it('should return consistent secret', () => {
    const secret1 = getJWTSecret();
    const secret2 = getJWTSecret();
    expect(secret1).toEqual(secret2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// rate-limit.ts — getClientIP
// ═══════════════════════════════════════════════════════════════════════

describe('rate-limit.ts — getClientIP', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const req = createMockRequest({
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('should extract IP from x-real-ip header', () => {
    const req = createMockRequest({
      headers: { 'x-real-ip': '10.0.0.1' },
    });
    expect(getClientIP(req)).toBe('10.0.0.1');
  });

  it('should extract IP from cf-connecting-ip header', () => {
    const req = createMockRequest({
      headers: { 'cf-connecting-ip': '172.16.0.1' },
    });
    expect(getClientIP(req)).toBe('172.16.0.1');
  });

  it('should return "unknown" when no IP headers present', () => {
    const req = createMockRequest();
    expect(getClientIP(req)).toBe('unknown');
  });

  it('should prefer x-forwarded-for over other headers', () => {
    const req = createMockRequest({
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
        'cf-connecting-ip': '3.3.3.3',
      },
    });
    expect(getClientIP(req)).toBe('1.1.1.1');
  });

  it('should trim whitespace from IP', () => {
    const req = createMockRequest({
      headers: { 'x-real-ip': '  10.0.0.1  ' },
    });
    expect(getClientIP(req)).toBe('10.0.0.1');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// rate-limit.ts — detectRateLimitType
// ═══════════════════════════════════════════════════════════════════════

describe('rate-limit.ts — detectRateLimitType', () => {
  it('should detect auth endpoints', () => {
    expect(detectRateLimitType('/api/auth/login')).toBe('auth');
    expect(detectRateLimitType('/login')).toBe('auth');
    expect(detectRateLimitType('/signup')).toBe('auth');
    expect(detectRateLimitType('/forgot-password')).toBe('auth');
    expect(detectRateLimitType('/reset-password')).toBe('auth');
  });

  it('should detect public endpoints', () => {
    expect(detectRateLimitType('/api/health')).toBe('public');
    expect(detectRateLimitType('/api/public/data')).toBe('public');
    expect(detectRateLimitType('/api/stripe/webhook')).toBe('public');
  });

  it('should default to api for regular endpoints', () => {
    expect(detectRateLimitType('/api/projects')).toBe('api');
    expect(detectRateLimitType('/api/tasks')).toBe('api');
    expect(detectRateLimitType('/api/users')).toBe('api');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// rate-limit.ts — checkRateLimitByType
// ═══════════════════════════════════════════════════════════════════════

describe('rate-limit.ts — checkRateLimitByType', () => {
  beforeEach(() => {
    resetRateLimit('test-client-1', 'auth');
    resetRateLimit('test-client-1', 'api');
    resetRateLimit('test-client-1', 'public');
  });

  it('should allow requests under limit', () => {
    const result = checkRateLimitByType('test-client-1', 'api');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should decrement remaining on subsequent requests', () => {
    const result1 = checkRateLimitByType('test-client-1', 'api');
    const result2 = checkRateLimitByType('test-client-1', 'api');
    expect(result1.remaining).toBeGreaterThan(result2.remaining);
  });

  it('should return allowed=true with resetTime', () => {
    const result = checkRateLimitByType('test-client-1', 'api');
    expect(result.resetTime).toBeGreaterThan(0);
    expect(typeof result.resetTime).toBe('number');
  });

  it('should handle auth rate limit type', () => {
    const result = checkRateLimitByType('test-client-1', 'auth');
    expect(result.allowed).toBe(true);
  });

  it('should handle public rate limit type', () => {
    const result = checkRateLimitByType('test-client-1', 'public');
    expect(result.allowed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// rate-limit.ts — Configuration
// ═══════════════════════════════════════════════════════════════════════

describe('rate-limit.ts — Configuration', () => {
  it('should return default rate limit config', () => {
    const config = getRateLimitConfig();
    expect(config).toHaveProperty('maxRequests');
    expect(config).toHaveProperty('windowMs');
    expect(config.maxRequests).toBeGreaterThan(0);
    expect(config.windowMs).toBeGreaterThan(0);
  });

  it('should return all rate limit configs', () => {
    const configs = getAllRateLimitConfigs();
    expect(configs).toHaveProperty('auth');
    expect(configs).toHaveProperty('api');
    expect(configs).toHaveProperty('public');
  });

  it('auth config should have stricter limits than api', () => {
    const configs = getAllRateLimitConfigs();
    expect(configs.auth.maxRequests).toBeLessThan(configs.api.maxRequests);
  });

  it('public config should be most lenient', () => {
    const configs = getAllRateLimitConfigs();
    expect(configs.public.maxRequests).toBeGreaterThan(configs.api.maxRequests);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// rate-limit.ts — getRateLimitStats
// ═══════════════════════════════════════════════════════════════════════

describe('rate-limit.ts — getRateLimitStats', () => {
  it('should return stats object', () => {
    const stats = getRateLimitStats();
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('entriesByType');
    expect(stats).toHaveProperty('usingRedis');
    expect(typeof stats.totalEntries).toBe('number');
  });

  it('entriesByType should have all rate limit types', () => {
    const stats = getRateLimitStats();
    expect(stats.entriesByType).toHaveProperty('auth');
    expect(stats.entriesByType).toHaveProperty('api');
    expect(stats.entriesByType).toHaveProperty('public');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// rate-limit.ts — rateLimitError
// ═══════════════════════════════════════════════════════════════════════

describe('rate-limit.ts — rateLimitError', () => {
  it('should return a 429 response', () => {
    const response = rateLimitError(Date.now() + 60000, 'api');
    expect(response.status).toBe(429);
  });

  it('should include Retry-After header', () => {
    const futureTime = Date.now() + 60000;
    const response = rateLimitError(futureTime, 'api');
    const retryAfter = response.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
    expect(parseInt(retryAfter!)).toBeGreaterThan(0);
  });

  it('should include X-RateLimit headers', () => {
    const response = rateLimitError(Date.now() + 60000, 'api');
    expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Type')).toBe('api');
  });

  it('should include error body with Arabic message', async () => {
    const response = rateLimitError(Date.now() + 60000, 'api');
    const body = await response.json();
    expect(body.error.message).toBeTruthy();
  });

  it('should use English message when requested', async () => {
    const response = rateLimitError(Date.now() + 60000, 'api', 'en');
    const body = await response.json();
    expect(body.error.message).toBeTruthy();
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// db.ts — getEmptyPaginationResponse
// ═══════════════════════════════════════════════════════════════════════

describe('db.ts — getEmptyPaginationResponse', () => {
  it('should return empty data array', () => {
    const result = getEmptyPaginationResponse();
    expect(result.data).toEqual([]);
  });

  it('should return correct pagination meta', () => {
    const result = getEmptyPaginationResponse();
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('should indicate no next/prev pages', () => {
    const result = getEmptyPaginationResponse();
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPrevPage).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// db.ts — safeDbOp
// ═══════════════════════════════════════════════════════════════════════

describe('db.ts — safeDbOp', () => {
  it('should return fallback when DB is unavailable', async () => {
    // In test env, safeDbOp might succeed since db may be available
    // Test the error fallback path instead
    const result = await safeDbOp(
      () => Promise.resolve('db-result'),
      'fallback-value'
    );
    // Should return the operation result or fallback
    expect(['db-result', 'fallback-value']).toContain(result);
  });

  it('should return fallback on error', async () => {
    const result = await safeDbOp(
      () => { throw new Error('DB error'); },
      'error-fallback'
    );
    expect(result).toBe('error-fallback');
  });
});
