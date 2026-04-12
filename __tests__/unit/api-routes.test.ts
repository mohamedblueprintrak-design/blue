/**
 * Unit Tests — API Route Utilities
 * Tests for auth, rate-limit, db, response, pagination, and demo-config helpers
 */

import {
  parsePaginationParams,
  buildPaginationMeta,
  calculateSkip,
  isPaginationRequested,
  buildSearchConditions,
  getEffectiveLimit,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '@/app/api/utils/pagination';

import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  rateLimitResponse,
  conflictResponse,
  badRequestResponse,
} from '@/app/api/utils/response';

import {
  detectRateLimitType,
  getAllRateLimitConfigs,
  getRateLimitConfig,
  getRateLimitStats,
  getClientIP,
} from '@/app/api/utils/rate-limit';

import {
  isAdmin,
  isHR,
  isAccountant,
  canApproveLeave,
  canApproveExpense,
} from '@/app/api/utils/auth';

import { isDemoUser, DEMO_DATA } from '@/app/api/utils/demo-config';

import { getEmptyPaginationResponse } from '@/app/api/utils/db';

// ─── Pagination Helpers ─────────────────────────────────────────────────────

describe('Pagination Utils', () => {
  describe('parsePaginationParams', () => {
    it('should return defaults when no params provided', () => {
      const params = parsePaginationParams(new URLSearchParams());
      expect(params.page).toBe(DEFAULT_PAGE);
      expect(params.limit).toBe(DEFAULT_LIMIT);
      expect(params.search).toBeUndefined();
    });

    it('should parse page parameter', () => {
      const params = parsePaginationParams(new URLSearchParams('page=5'));
      expect(params.page).toBe(5);
    });

    it('should clamp page to minimum of 1', () => {
      const params = parsePaginationParams(new URLSearchParams('page=0'));
      expect(params.page).toBe(1);
    });

    it('should clamp negative page to 1', () => {
      const params = parsePaginationParams(new URLSearchParams('page=-5'));
      expect(params.page).toBe(1);
    });

    it('should handle non-numeric page as default', () => {
      const params = parsePaginationParams(new URLSearchParams('page=abc'));
      expect(params.page).toBe(DEFAULT_PAGE);
    });

    it('should parse limit parameter', () => {
      const params = parsePaginationParams(new URLSearchParams('limit=50'));
      expect(params.limit).toBe(50);
    });

    it('should clamp limit to MAX_LIMIT', () => {
      const params = parsePaginationParams(new URLSearchParams('limit=999'));
      expect(params.limit).toBe(MAX_LIMIT);
    });

    it('should default to DEFAULT_LIMIT when limit is 0', () => {
      const params = parsePaginationParams(new URLSearchParams('limit=0'));
      expect(params.limit).toBe(DEFAULT_LIMIT);
    });

    it('should parse search parameter', () => {
      const params = parsePaginationParams(new URLSearchParams('search=test'));
      expect(params.search).toBe('test');
    });

    it('should handle all parameters together', () => {
      const params = parsePaginationParams(new URLSearchParams('page=3&limit=25&search=hello'));
      expect(params.page).toBe(3);
      expect(params.limit).toBe(25);
      expect(params.search).toBe('hello');
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct meta for first page', () => {
      const meta = buildPaginationMeta(1, 10, 100);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(10);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(false);
    });

    it('should build correct meta for last page', () => {
      const meta = buildPaginationMeta(10, 10, 100);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(true);
    });

    it('should handle single page', () => {
      const meta = buildPaginationMeta(1, 10, 5);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(false);
    });

    it('should handle empty results', () => {
      const meta = buildPaginationMeta(1, 10, 0);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasNextPage).toBe(false);
    });

    it('should handle partial last page', () => {
      const meta = buildPaginationMeta(2, 10, 15);
      expect(meta.totalPages).toBe(2);
      expect(meta.hasNextPage).toBe(false);
    });
  });

  describe('calculateSkip', () => {
    it('should return 0 for page 1', () => {
      expect(calculateSkip(1, 10)).toBe(0);
    });

    it('should calculate correct skip', () => {
      expect(calculateSkip(3, 20)).toBe(40);
    });

    it('should calculate correct skip for large pages', () => {
      expect(calculateSkip(100, 50)).toBe(4950);
    });
  });

  describe('isPaginationRequested', () => {
    it('should return true when page param exists', () => {
      expect(isPaginationRequested(new URLSearchParams('page=1'))).toBe(true);
    });

    it('should return true when limit param exists', () => {
      expect(isPaginationRequested(new URLSearchParams('limit=10'))).toBe(true);
    });

    it('should return false when no pagination params', () => {
      expect(isPaginationRequested(new URLSearchParams('search=test'))).toBe(false);
    });
  });

  describe('buildSearchConditions', () => {
    it('should return undefined when no search', () => {
      expect(buildSearchConditions(undefined, ['name'])).toBeUndefined();
    });

    it('should return conditions for each field', () => {
      const conditions = buildSearchConditions('test', ['name', 'email']);
      expect(conditions).toHaveLength(2);
      expect(conditions![0]).toEqual({ name: { contains: 'test', mode: 'insensitive' } });
      expect(conditions![1]).toEqual({ email: { contains: 'test', mode: 'insensitive' } });
    });

    it('should return single condition for single field', () => {
      const conditions = buildSearchConditions('hello', ['title']);
      expect(conditions).toHaveLength(1);
    });
  });

  describe('getEffectiveLimit', () => {
    it('should return requested limit when pagination is used', () => {
      expect(getEffectiveLimit(true, 25)).toBe(25);
    });

    it('should return backward compat limit when pagination is not used', () => {
      expect(getEffectiveLimit(false, 25)).toBe(100);
    });
  });
});

// ─── Rate Limit Helpers ─────────────────────────────────────────────────────

describe('Rate Limit Utils', () => {
  describe('detectRateLimitType', () => {
    it('should return auth for /api/auth/ paths', () => {
      expect(detectRateLimitType('/api/auth/login')).toBe('auth');
    });

    it('should return auth for login paths', () => {
      expect(detectRateLimitType('/login')).toBe('auth');
    });

    it('should return auth for signup paths', () => {
      expect(detectRateLimitType('/signup')).toBe('auth');
    });

    it('should return auth for forgot-password paths', () => {
      expect(detectRateLimitType('/forgot-password')).toBe('auth');
    });

    it('should return auth for reset-password paths', () => {
      expect(detectRateLimitType('/reset-password')).toBe('auth');
    });

    it('should return public for /api/health paths', () => {
      expect(detectRateLimitType('/api/health')).toBe('public');
    });

    it('should return public for /api/public paths', () => {
      expect(detectRateLimitType('/api/public/data')).toBe('public');
    });

    it('should return public for stripe webhook', () => {
      expect(detectRateLimitType('/api/stripe/webhook')).toBe('public');
    });

    it('should return api for general API paths', () => {
      expect(detectRateLimitType('/api/projects')).toBe('api');
    });

    it('should return api for unknown paths', () => {
      expect(detectRateLimitType('/api/something')).toBe('api');
    });
  });

  describe('getAllRateLimitConfigs', () => {
    it('should return configs for all three types', () => {
      const configs = getAllRateLimitConfigs();
      expect(configs).toHaveProperty('auth');
      expect(configs).toHaveProperty('api');
      expect(configs).toHaveProperty('public');
    });

    it('auth should be stricter than api', () => {
      const configs = getAllRateLimitConfigs();
      expect(configs.auth.maxRequests).toBeLessThan(configs.api.maxRequests);
    });

    it('api should be stricter than public', () => {
      const configs = getAllRateLimitConfigs();
      expect(configs.api.maxRequests).toBeLessThan(configs.public.maxRequests);
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return default api config', () => {
      const config = getRateLimitConfig();
      expect(config).toHaveProperty('maxRequests');
      expect(config).toHaveProperty('windowMs');
    });
  });

  describe('getRateLimitStats', () => {
    it('should return stats with correct shape', () => {
      const stats = getRateLimitStats();
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('entriesByType');
      expect(stats).toHaveProperty('usingRedis');
      expect(stats.entriesByType).toHaveProperty('auth');
      expect(stats.entriesByType).toHaveProperty('api');
      expect(stats.entriesByType).toHaveProperty('public');
    });
  });

  describe('getClientIP', () => {
    function createMockRequest(headers: Record<string, string> = {}) {
      return {
        headers: {
          get: (key: string) => headers[key.toLowerCase()] || null,
        },
      } as any;
    }

    it('should extract IP from x-forwarded-for', () => {
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
      expect(getClientIP(req)).toBe('1.2.3.4');
    });

    it('should extract IP from x-real-ip', () => {
      const req = createMockRequest({ 'x-real-ip': '10.0.0.1' });
      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    it('should extract IP from cf-connecting-ip', () => {
      const req = createMockRequest({ 'cf-connecting-ip': '192.168.1.1' });
      expect(getClientIP(req)).toBe('192.168.1.1');
    });

    it('should return unknown when no headers present', () => {
      const req = createMockRequest();
      expect(getClientIP(req)).toBe('unknown');
    });
  });
});

// ─── Response Helpers ─────────────────────────────────────────────────────

describe('Response Utils', () => {
  // Helper: NextResponse.json() body is a ReadableStream — extract via headers
  async function getBody(res: Response): Promise<Record<string, unknown>> {
    if (typeof res.body === 'string') return JSON.parse(res.body);
    // ReadableStream: accumulate chunks
    const reader = res.body?.getReader();
    if (!reader) return {};
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    return JSON.parse(text);
  }

  describe('successResponse', () => {
    it('should return status 200', () => {
      const res = successResponse({ id: 1, name: 'Test' });
      expect(res.status).toBe(200);
    });

    it('should have JSON content type', () => {
      const res = successResponse({ id: 1 });
      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('should normalize UPPERCASE enum values to lowercase', async () => {
      const res = successResponse({ status: 'ACTIVE', priority: 'HIGH', role: 'ADMIN' });
      const body = await getBody(res);
      expect((body as any).data.status).toBe('active');
      expect((body as any).data.priority).toBe('high');
      expect((body as any).data.role).toBe('ADMIN');
    });
  });

  describe('errorResponse', () => {
    it('should return status 400 by default', () => {
      const res = errorResponse('Something went wrong');
      expect(res.status).toBe(400);
    });

    it('should accept custom code and status', () => {
      const res = errorResponse('Not found', 'NOT_FOUND', 404);
      expect(res.status).toBe(404);
    });

    it('should return correct message for not found', () => {
      const res = notFoundResponse();
      expect(res.status).toBe(404);
    });

    it('should return 401 for unauthorized', () => {
      const res = unauthorizedResponse();
      expect(res.status).toBe(401);
    });

    it('should return 403 for forbidden', () => {
      const res = forbiddenResponse();
      expect(res.status).toBe(403);
    });
  });

  describe('validationErrorResponse', () => {
    it('should return 400 status', () => {
      const res = validationErrorResponse('Invalid email', 'email');
      expect(res.status).toBe(400);
    });
  });

  describe('rateLimitResponse', () => {
    it('should return 429 with Retry-After header', () => {
      const res = rateLimitResponse(60);
      expect(res.status).toBe(429);
      expect(res.headers.get('retry-after')).toBe('60');
      expect(res.headers.get('x-ratelimit-reset')).toBeTruthy();
    });
  });

  describe('conflictResponse', () => {
    it('should return 409 status', () => {
      const res = conflictResponse('Duplicate entry');
      expect(res.status).toBe(409);
    });
  });

  describe('badRequestResponse', () => {
    it('should return 400 status', () => {
      const res = badRequestResponse('Invalid input');
      expect(res.status).toBe(400);
    });
  });
});

// ─── Auth Helpers ─────────────────────────────────────────────────────────

describe('Auth Utils', () => {
  describe('isAdmin', () => {
    it('should return true for ADMIN (uppercase)', () => {
      expect(isAdmin({ role: 'ADMIN' } as any)).toBe(true);
    });

    it('should return true for admin (lowercase)', () => {
      expect(isAdmin({ role: 'admin' } as any)).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isAdmin({ role: 'MANAGER' } as any)).toBe(false);
      expect(isAdmin({ role: 'VIEWER' } as any)).toBe(false);
    });
  });

  describe('isHR', () => {
    it('should return true for HR (uppercase)', () => {
      expect(isHR({ role: 'HR' } as any)).toBe(true);
    });

    it('should return true for hr (lowercase)', () => {
      expect(isHR({ role: 'hr' } as any)).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isHR({ role: 'ADMIN' } as any)).toBe(false);
    });
  });

  describe('isAccountant', () => {
    it('should return true for ACCOUNTANT', () => {
      expect(isAccountant({ role: 'ACCOUNTANT' } as any)).toBe(true);
    });

    it('should return true for accountant', () => {
      expect(isAccountant({ role: 'accountant' } as any)).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isAccountant({ role: 'ENGINEER' } as any)).toBe(false);
    });
  });

  describe('canApproveLeave', () => {
    it('should allow admin to approve', () => {
      expect(canApproveLeave({ role: 'ADMIN' } as any)).toBe(true);
    });

    it('should allow HR to approve', () => {
      expect(canApproveLeave({ role: 'HR' } as any)).toBe(true);
    });

    it('should allow manager to approve', () => {
      expect(canApproveLeave({ role: 'MANAGER' } as any)).toBe(true);
    });

    it('should not allow engineer to approve', () => {
      expect(canApproveLeave({ role: 'ENGINEER' } as any)).toBe(false);
    });

    it('should not allow viewer to approve', () => {
      expect(canApproveLeave({ role: 'VIEWER' } as any)).toBe(false);
    });

    it('should handle lowercase roles', () => {
      expect(canApproveLeave({ role: 'admin' } as any)).toBe(true);
      expect(canApproveLeave({ role: 'manager' } as any)).toBe(true);
    });
  });

  describe('canApproveExpense', () => {
    it('should allow admin to approve', () => {
      expect(canApproveExpense({ role: 'ADMIN' } as any)).toBe(true);
    });

    it('should allow accountant to approve', () => {
      expect(canApproveExpense({ role: 'ACCOUNTANT' } as any)).toBe(true);
    });

    it('should allow manager to approve', () => {
      expect(canApproveExpense({ role: 'MANAGER' } as any)).toBe(true);
    });

    it('should not allow HR to approve expenses', () => {
      expect(canApproveExpense({ role: 'HR' } as any)).toBe(false);
    });
  });
});

// ─── Demo Config ──────────────────────────────────────────────────────────

describe('Demo Config', () => {
  describe('isDemoUser', () => {
    it('should return true for demo user IDs', () => {
      expect(isDemoUser('demo-admin-001')).toBe(true);
      expect(isDemoUser('demo-user-001')).toBe(true);
    });

    it('should return false for non-demo user IDs', () => {
      expect(isDemoUser('real-user-123')).toBe(false);
      expect(isDemoUser('')).toBe(false);
    });
  });

  describe('DEMO_DATA', () => {
    it('should have projects', () => {
      expect(DEMO_DATA.projects.length).toBeGreaterThan(0);
      expect(DEMO_DATA.projects[0]).toHaveProperty('id');
      expect(DEMO_DATA.projects[0]).toHaveProperty('name');
      expect(DEMO_DATA.projects[0]).toHaveProperty('status');
    });

    it('should have clients', () => {
      expect(DEMO_DATA.clients.length).toBeGreaterThan(0);
    });

    it('should have tasks', () => {
      expect(DEMO_DATA.tasks.length).toBeGreaterThan(0);
    });

    it('should have dashboard stats', () => {
      expect(DEMO_DATA.dashboard).toBeDefined();
      expect(DEMO_DATA.dashboard).toHaveProperty('projects');
      expect(DEMO_DATA.dashboard).toHaveProperty('financial');
    });

    it('should have meetings with required fields', () => {
      expect(DEMO_DATA.meetings.length).toBeGreaterThan(0);
      const meeting = DEMO_DATA.meetings[0];
      expect(meeting).toHaveProperty('title');
      expect(meeting).toHaveProperty('date');
      expect(meeting).toHaveProperty('type');
      expect(meeting).toHaveProperty('status');
    });
  });

  describe('getEmptyPaginationResponse', () => {
    it('should return empty pagination response', () => {
      const response = getEmptyPaginationResponse();
      expect(response.data).toEqual([]);
      expect(response.meta.page).toBe(1);
      expect(response.meta.limit).toBe(20);
      expect(response.meta.total).toBe(0);
      expect(response.meta.totalPages).toBe(0);
      expect(response.meta.hasNextPage).toBe(false);
      expect(response.meta.hasPrevPage).toBe(false);
    });
  });
});
