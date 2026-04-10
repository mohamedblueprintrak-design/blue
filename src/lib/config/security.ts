/**
 * Security Configuration
 * إعدادات الأمان
 *
 * Centralized security configuration extracted from Blue's auth modules.
 * Follows BluePrint's config pattern for consistency.
 *
 * Sections:
 * - Environment helpers & detection
 * - JWT configuration
 * - Rate limiting configuration
 * - Password policies
 * - Session management
 * - CORS settings
 * - Content Security Policy
 * - Security headers
 * - File upload security
 */

// ============================================
// Environment Helpers
// ============================================

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue
}

// ============================================
// Environment Detection
// ============================================

export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'

// ============================================
// JWT Configuration
// ============================================

/**
 * JWT configuration aligned with Blue's auth/modules/jwt.ts:
 *   - Algorithm: HS256
 *   - Issuer: blueprint-saas
 *   - Audience: blueprint-users
 *   - Secret: from JWT_SECRET env var (required in production, dev fallback provided)
 *   - Access token expiry: 2h
 *   - Refresh token expiry: 7d
 *   - Password reset token expiry: 1h
 *   - Email verification token expiry: 24h
 */
export const JWT_CONFIG = {
  get secret(): Uint8Array {
    const secret = isProduction
      ? requireEnv('JWT_SECRET')
      : getEnv('JWT_SECRET', 'development-secret-key-at-least-32-characters-long')

    if (isDevelopment && secret === 'development-secret-key-at-least-32-characters-long') {
      console.warn('⚠️ Using development JWT secret. Set JWT_SECRET in production!')
    }

    // Validate minimum length
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long')
    }

    return new TextEncoder().encode(secret)
  },

  /** JWT signing algorithm — must match across all token operations */
  algorithm: 'HS256' as const,

  /** JWT issuer claim — identifies the token producer */
  issuer: 'blueprint-saas' as const,

  /** JWT audience claim — identifies the intended recipient */
  audience: 'blueprint-users' as const,

  /** Short-lived access token expiry (default: 2h) */
  expiresIn: getEnv('JWT_EXPIRES_IN', '2h'),

  /** Refresh token expiry (default: 7d) */
  refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  /** Password reset token expiry */
  passwordResetExpiresIn: '1h',

  /** Email verification token expiry */
  emailVerificationExpiresIn: '24h',
}

// ============================================
// Rate Limiting Configuration
// ============================================

/**
 * Rate limiting configuration aligned with Blue's auth/modules/rate-limiter.ts:
 *   - API: 100 requests / 60s
 *   - Auth: 10 requests / 60s (stricter)
 *   - Public: 200 requests / 60s (more lenient)
 */
export const RATE_LIMIT_CONFIG = {
  // General API rate limit
  windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '60000') || '60000'),
  maxRequests: parseInt(getEnv('RATE_LIMIT_MAX', '100') || '100'),

  // Auth endpoints (stricter)
  authWindowMs: parseInt(getEnv('RATE_LIMIT_AUTH_WINDOW_MS', '60000') || '60000'),
  authMaxRequests: parseInt(getEnv('RATE_LIMIT_AUTH_MAX', '10') || '10'),

  // Public endpoints (more lenient)
  publicWindowMs: parseInt(getEnv('RATE_LIMIT_PUBLIC_WINDOW_MS', '60000') || '60000'),
  publicMaxRequests: parseInt(getEnv('RATE_LIMIT_PUBLIC_MAX', '200') || '200'),
}

// ============================================
// Password Configuration
// ============================================

/**
 * Password policy configuration aligned with Blue's auth/modules/password.ts:
 *   - Minimum length: 8 characters
 *   - Requires uppercase, lowercase, number, and special character
 *   - bcrypt rounds: 12 (minimum recommended)
 */
export const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  bcryptRounds: 12,
  maxAge: 90 * 24 * 60 * 60,  // 90 days in seconds
  historyCount: 5,             // Remember last 5 passwords
}

// ============================================
// Session Configuration
// ============================================

export const SESSION_CONFIG = {
  maxAge: 7 * 24 * 60 * 60,   // 7 days in seconds
  cookieName: 'blue_token',
  secureCookies: isProduction,
  sameSite: 'strict' as const,
  httpOnly: true,
  path: '/',
}

// ============================================
// CORS Configuration
// ============================================

function getCorsOrigins(): string[] {
  const envOrigins = getEnv('CORS_ORIGINS') || getEnv('ALLOWED_ORIGINS') || ''

  if (isProduction) {
    const origins = envOrigins
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)

    if (origins.length === 0) {
      console.warn(
        '⚠️ CORS_ORIGINS or ALLOWED_ORIGINS is not set in production. ' +
        'CORS will be disabled. Set this to your domain(s).'
      )
      return []
    }

    return origins
  }

  // In development, allow common local origins
  const devOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:4000',
  ]

  // Add any custom origins from env
  const customOrigins = envOrigins
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  return [...devOrigins, ...customOrigins]
}

export const CORS_CONFIG = {
  allowedOrigins: getCorsOrigins(),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Accept',
    'Origin',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false

  if (isDevelopment && CORS_CONFIG.allowedOrigins.length === 0) {
    return true
  }

  return CORS_CONFIG.allowedOrigins.includes(origin)
}

// ============================================
// Content Security Policy
// ============================================

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://js.stripe.com',
    'https://cdnjs.cloudflare.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    ...(isDevelopment ? ['http:'] : []),
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://checkout.stripe.com',
    'https://*.openstreetmap.org',
    'https://*.tile.openstreetmap.org',
  ],
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://checkout.stripe.com',
    'https://www.openstreetmap.org',
    'https://*.openstreetmap.org',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'upgrade-insecure-requests': isProduction ? [] : undefined,
}

/**
 * Generate CSP header value
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .filter(([, values]) => values !== undefined)
    .map(([directive, values]) => {
      if (!values || values.length === 0) {
        return directive
      }
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
}

// ============================================
// Security Headers
// ============================================

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

/**
 * Get all security headers including CSP
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Content-Security-Policy': generateCSPHeader(),
    ...(isProduction && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
  }
}

// ============================================
// File Upload Security
// ============================================

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
    'text/csv',
  ],
  // Dangerous file extensions to block
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.sh', '.ps1',
    '.js', '.jsx', '.ts', '.tsx',
    '.php', '.py', '.rb', '.pl',
    '.dll', '.so', '.dylib',
    '.jar', '.war', '.ear',
  ],
  uploadPath: 'uploads',
}

/**
 * Validate file type
 */
export function isAllowedFileType(mimeType: string): boolean {
  return UPLOAD_CONFIG.allowedTypes.includes(mimeType)
}

/**
 * Validate file extension
 */
export function isBlockedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return UPLOAD_CONFIG.blockedExtensions.includes(ext)
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.substring(originalName.lastIndexOf('.'))
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50)

  return `${timestamp}_${random}_${safeName}${ext}`
}

// ============================================
// Export Config Object
// ============================================

export const securityConfig = {
  isProduction,
  isDevelopment,
  isTest,
  jwt: JWT_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  password: PASSWORD_CONFIG,
  session: SESSION_CONFIG,
  cors: CORS_CONFIG,
  security: SECURITY_HEADERS,
  upload: UPLOAD_CONFIG,
  getEnv,
  requireEnv,
}
