/**
 * Enhanced Authentication, Rate Limiting & Security Middleware
 * وسيط المصادقة وتحديد معدل الطلبات والحماية
 *
 * Edge Runtime Compatible — Uses only Web APIs
 * Protects routes, validates JWT tokens, enforces CSRF, limits request rates
 *
 * AUTH ARCHITECTURE:
 * This middleware uses the CUSTOM JWT system (jose) for authentication,
 * NOT NextAuth.js. The 'blue_token' cookie is verified against JWT_SECRET.
 * See src/lib/auth.ts for the full dual-auth architecture overview.
 *
 * RATE LIMITING NOTE:
 * Rate limiting uses in-memory storage (Map), which is suitable for
 * single-instance deployments. For multi-instance production deployments,
 * use Redis-backed rate limiting via src/lib/rate-limiter.ts in API routes,
 * or an external service (Cloudflare Rate Limiting, Nginx limit_req, etc.).
 *
 * PRODUCTION WARNING: In-memory rate limiting does NOT work correctly across
 * multiple server replicas. Each replica has its own Map store, so an attacker
 * can send N * replica_count requests before being rate-limited.
 * Solution: Use the rate-limiter.ts (Redis-backed) in API routes, and configure
 * Nginx or Cloudflare rate limiting at the reverse proxy layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretBytes } from '@/lib/auth/jwt-secret';

// ============================================
// Types
// ============================================

type RateLimitType = 'auth' | 'api' | 'public';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

// ============================================
// Configuration
// ============================================

const COOKIE_NAME = 'blue_token';

const RATE_LIMIT_CONFIGS = {
  auth: { maxRequests: 10, windowMs: 60000 },      // 10 req/min for auth
  api: { maxRequests: 100, windowMs: 60000 },      // 100 req/min for API
  public: { maxRequests: 200, windowMs: 60000 },   // 200 req/min for public
};

// Public page routes that don't require authentication
const PUBLIC_PAGE_ROUTES = [
  '/',
  '/services',
  '/calculator',
  '/quote',
  '/portal',
  '/about',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/2fa-setup',
];

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/2fa',
  '/api/auth/2fa/verify',
  '/api/auth/2fa/backup-codes',
  '/api/init',
  '/api/quote-requests',
  '/api/health',
  '/api/stripe/webhook',
  '/api/public',
  '/api/ai/providers',
  '/api/ai/debug',
];

/**
 * Paths that require specific roles for access
 */
const ROLE_PROTECTED_PATHS: Record<string, string[]> = {
  '/admin': ['admin'],
  '/settings': ['admin', 'manager'],
  '/reports': ['admin', 'manager', 'accountant'],
  '/hr': ['admin', 'manager', 'hr'],
};

// ============================================
// Rate Limiting (Edge Runtime Compatible)
// ============================================

const rateLimitStore = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX_ENTRIES = 10000; // Prevent unbounded memory growth
const RATE_LIMIT_CLEANUP_INTERVAL = 60000; // Cleanup every 60 seconds
let lastCleanupTime = 0;

/**
 * Cleanup expired entries and enforce maximum store size.
 * Runs automatically before each rate limit check.
 * This prevents memory leaks in long-running Edge instances.
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  if (now - lastCleanupTime < RATE_LIMIT_CLEANUP_INTERVAL) return;
  lastCleanupTime = now;

  // Remove expired entries
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Enforce maximum size — remove oldest entries first
  if (rateLimitStore.size > RATE_LIMIT_MAX_ENTRIES) {
    const entriesToDelete = rateLimitStore.size - RATE_LIMIT_MAX_ENTRIES;
    let deleted = 0;
    for (const [key, _record] of rateLimitStore.entries()) {
      if (deleted >= entriesToDelete) break;
      rateLimitStore.delete(key);
      deleted++;
    }
  }
}

function getClientIP(request: NextRequest): string {
  const ipRegex = /^[0-9a-fA-F.:]+$/;
  const maxIPLength = 45; // Max IPv6 address length

  function sanitize(ip: string): string {
    const cleaned = ip.trim();
    if (cleaned.length > maxIPLength || !ipRegex.test(cleaned)) return 'unknown';
    return cleaned;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    const sanitized = sanitize(candidate);
    if (sanitized !== 'unknown') return sanitized;
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    const sanitized = sanitize(realIP);
    if (sanitized !== 'unknown') return sanitized;
  }
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    const sanitized = sanitize(cfIP);
    if (sanitized !== 'unknown') return sanitized;
  }
  return 'unknown';
}

function detectRateLimitType(pathname: string): RateLimitType {
  if (
    pathname.includes('/api/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/reset-password')
  ) {
    return 'auth';
  }
  if (
    pathname.includes('/api/health') ||
    pathname.includes('/api/public') ||
    pathname.includes('/api/stripe/webhook')
  ) {
    return 'public';
  }
  return 'api';
}

function checkRateLimit(ip: string, type: RateLimitType): RateLimitResult {
  cleanupRateLimitStore();
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `${ip}:${type}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
}

function rateLimitResponse(resetTime: number, type: RateLimitType, language: 'ar' | 'en'): NextResponse {
  const config = RATE_LIMIT_CONFIGS[type];
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  const messages = {
    auth: {
      ar: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح. يرجى المحاولة بعد دقيقة.',
      en: 'Too many login attempts. Please try again later.',
    },
    api: {
      ar: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
      en: 'Rate limit exceeded. Please try again later.',
    },
    public: {
      ar: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
      en: 'Rate limit exceeded. Please try again later.',
    },
  };

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: messages[type][language],
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'X-RateLimit-Type': type,
      },
    }
  );
}

// ============================================
// JWT Verification (Edge Runtime Compatible)
// ============================================

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name || payload.username || '') as string,
      role: payload.role as string,
      organizationId: payload.organizationId as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try cookie (Blue uses blue_token)
  const tokenCookie = request.cookies.get(COOKIE_NAME);
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

function isPublicPageRoute(pathname: string): boolean {
  if (PUBLIC_PAGE_ROUTES.includes(pathname)) return true;
  if (pathname === '/dashboard') return true; // Login page
  return false;
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

function isStaticFile(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/favicon') ||
    /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/i.test(pathname)
  );
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [path, roles] of Object.entries(ROLE_PROTECTED_PATHS)) {
    if (pathname.startsWith(path)) {
      return roles;
    }
  }
  return null;
}

// ============================================
// Main Middleware Function
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  // ============================================
  // Rate Limiting for API Endpoints
  // ============================================
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(request);
    const rateLimitType = detectRateLimitType(pathname);
    const rateLimitResult = checkRateLimit(ip, rateLimitType);

    if (!rateLimitResult.allowed) {
      const acceptLanguage = request.headers.get('accept-language') || '';
      const language: 'ar' | 'en' = acceptLanguage.includes('ar') ? 'ar' : 'en';
      return rateLimitResponse(rateLimitResult.resetTime, rateLimitType, language);
    }
  }

  // ============================================
  // CSRF Protection for Mutations (API only)
  // ============================================
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  const csrfExemptPaths = [
    '/api/stripe/webhook',
    '/api/health',
    '/api/auth',
    '/api/init',
    '/api/seed',
    '/api/quote-requests',
  ];
  const isCsrfExempt = csrfExemptPaths.some(p => pathname.startsWith(p));

  if (pathname.startsWith('/api/') && isMutation && !isCsrfExempt) {
    const csrfCookie = request.cookies.get('csrf_token');
    const csrfHeader = request.headers.get('x-csrf-token');

    if (!csrfCookie?.value || !csrfHeader || csrfCookie.value !== csrfHeader) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_INVALID',
            message: process.env.NODE_ENV === 'development'
              ? 'CSRF token missing or invalid. Include X-CSRF-Token header matching csrf_token cookie.'
              : 'Invalid request. Please refresh the page and try again.',
          },
        },
        { status: 403 }
      );
    }
  }

  // ============================================
  // Handle CORS Preflight (OPTIONS) Requests
  // ============================================
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '*';
    const isDev = process.env.NODE_ENV === 'development';
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    const allowOrigin = isDev
      ? (origin && origin !== 'null' ? origin : 'http://localhost:3000')
      : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-Requested-With, X-HTTP-Method-Override, Cache-Control, X-CSRF-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // ============================================
  // Generate CSRF token for page GET requests
  // ============================================
  // Track whether we need to set a new CSRF cookie on the response.
  // This must be applied to ALL response paths for page GET requests,
  // not just the first NextResponse.next() that gets discarded.
  const isPageGet = !pathname.startsWith('/api/') && request.method === 'GET';
  const existingCsrf = request.cookies.get('csrf_token');
  const needsCsrfCookie = isPageGet && !existingCsrf?.value;
  const csrfTokenValue = needsCsrfCookie ? crypto.randomUUID().replace(/-/g, '') : null;

  /** Helper: attach CSRF cookie to a response if needed */
  function applyCsrfCookie(resp: NextResponse): NextResponse {
    if (needsCsrfCookie && csrfTokenValue) {
      resp.cookies.set('csrf_token', csrfTokenValue, {
        path: '/',
        httpOnly: false, // Must be readable by JS for double-submit
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }
    return resp;
  }

  // ============================================
  // Public API routes — skip auth
  // ============================================
  if (pathname.startsWith('/api/') && isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // ============================================
  // Public page routes — skip auth (with CSRF cookie)
  // ============================================
  if (!pathname.startsWith('/api/') && isPublicPageRoute(pathname)) {
    return applyCsrfCookie(NextResponse.next());
  }

  // ============================================
  // Extract and verify token
  // ============================================
  const token = extractToken(request);

  if (!token) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'غير مصرح. يرجى تسجيل الدخول' } },
        { status: 401 }
      );
    }
    // Pages: redirect to login (Blue's login page is /dashboard)
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/dashboard';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT token
  const payload = await verifyToken(token);

  if (!payload) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'رمز المصادقة غير صالح أو منتهي الصلاحية' } },
        { status: 401 }
      );
    }
    // Pages: redirect to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/dashboard';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ============================================
  // Role-Based Access Control (RBAC)
  // ============================================
  const userRole = payload.role.toLowerCase();
  const requiredRoles = getRequiredRoles(pathname);

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    // API routes: return 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'صلاحيات غير كافية' } },
        { status: 403 }
      );
    }
    // Pages: redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ============================================
  // Forward user info to API routes via headers
  // ============================================
  const response = applyCsrfCookie(NextResponse.next());
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-role', payload.role);
    response.headers.set('x-user-name', encodeURIComponent(payload.name));
    if (payload.organizationId) {
      response.headers.set('x-organization-id', payload.organizationId);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|public/).*)',
  ],
};
