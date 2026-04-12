/**
 * Unit Tests — Security Configuration
 * اختبارات إعدادات الأمان
 */

import {
  isProduction,
  isDevelopment,
  JWT_CONFIG,
  RATE_LIMIT_CONFIG,
  PASSWORD_CONFIG,
  SESSION_CONFIG,
  CORS_CONFIG,
  UPLOAD_CONFIG,
  generateCSPHeader,
  getSecurityHeaders,
  isAllowedFileType,
  isBlockedExtension,
  generateSafeFilename,
} from '@/lib/config/security';

describe('Security Configuration', () => {
  // ==========================================
  // Environment Detection
  // ==========================================

  describe('Environment Detection', () => {
    it('should have isDevelopment and isProduction as booleans', () => {
      expect(typeof isDevelopment).toBe('boolean');
      expect(typeof isProduction).toBe('boolean');
    });
  });

  // ==========================================
  // JWT Configuration
  // ==========================================

  describe('JWT Config', () => {
    it('should have correct algorithm', () => {
      expect(JWT_CONFIG.algorithm).toBe('HS256');
    });

    it('should have correct issuer', () => {
      expect(JWT_CONFIG.issuer).toBe('blueprint-saas');
    });

    it('should have correct audience', () => {
      expect(JWT_CONFIG.audience).toBe('blueprint-users');
    });

    it('should return a valid secret key', () => {
      const secret = JWT_CONFIG.secret;
      expect(secret).toBeInstanceOf(Uint8Array);
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should have default expiry times', () => {
      expect(JWT_CONFIG.expiresIn).toBe('2h');
      expect(JWT_CONFIG.refreshExpiresIn).toBe('7d');
    });

    it('should have short password reset expiry', () => {
      expect(JWT_CONFIG.passwordResetExpiresIn).toBe('1h');
    });
  });

  // ==========================================
  // Rate Limiting
  // ==========================================

  describe('Rate Limit Config', () => {
    it('should have stricter auth limits', () => {
      expect(RATE_LIMIT_CONFIG.authMaxRequests).toBeLessThan(RATE_LIMIT_CONFIG.maxRequests);
    });

    it('should have more lenient public limits', () => {
      expect(RATE_LIMIT_CONFIG.publicMaxRequests).toBeGreaterThan(RATE_LIMIT_CONFIG.maxRequests);
    });

    it('should have positive window values', () => {
      expect(RATE_LIMIT_CONFIG.windowMs).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIG.authWindowMs).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIG.publicWindowMs).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Password Configuration
  // ==========================================

  describe('Password Config', () => {
    it('should require minimum 8 characters', () => {
      expect(PASSWORD_CONFIG.minLength).toBe(8);
    });

    it('should require all character types', () => {
      expect(PASSWORD_CONFIG.requireUppercase).toBe(true);
      expect(PASSWORD_CONFIG.requireLowercase).toBe(true);
      expect(PASSWORD_CONFIG.requireNumber).toBe(true);
      expect(PASSWORD_CONFIG.requireSpecialChar).toBe(true);
    });

    it('should use secure bcrypt rounds', () => {
      expect(PASSWORD_CONFIG.bcryptRounds).toBeGreaterThanOrEqual(10);
    });
  });

  // ==========================================
  // Session Configuration
  // ==========================================

  describe('Session Config', () => {
    it('should use httpOnly cookies', () => {
      expect(SESSION_CONFIG.httpOnly).toBe(true);
    });

    it('should use blue_token as cookie name', () => {
      expect(SESSION_CONFIG.cookieName).toBe('blue_token');
    });

    it('should have 7-day session max age', () => {
      expect(SESSION_CONFIG.maxAge).toBe(7 * 24 * 60 * 60);
    });

    it('should use strict sameSite', () => {
      expect(SESSION_CONFIG.sameSite).toBe('strict');
    });
  });

  // ==========================================
  // CORS Configuration
  // ==========================================

  describe('CORS Config', () => {
    it('should allow common HTTP methods', () => {
      expect(CORS_CONFIG.allowedMethods).toContain('GET');
      expect(CORS_CONFIG.allowedMethods).toContain('POST');
      expect(CORS_CONFIG.allowedMethods).toContain('PUT');
      expect(CORS_CONFIG.allowedMethods).toContain('DELETE');
      expect(CORS_CONFIG.allowedMethods).toContain('PATCH');
    });

    it('should allow credentials', () => {
      expect(CORS_CONFIG.credentials).toBe(true);
    });

    it('should have allowed origins', () => {
      expect(CORS_CONFIG.allowedOrigins.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // CSP & Security Headers
  // ==========================================

  describe('CSP', () => {
    it('should generate a valid CSP string', () => {
      const csp = generateCSPHeader();
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
    });

    it('should block object-src', () => {
      const csp = generateCSPHeader();
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe('Security Headers', () => {
    it('should include essential security headers', () => {
      const headers = getSecurityHeaders();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
      expect(headers['Referrer-Policy']).toBeDefined();
    });
  });

  // ==========================================
  // File Upload Security
  // ==========================================

  describe('File Upload Config', () => {
    it('should have max file size', () => {
      expect(UPLOAD_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
    });

    it('should block dangerous extensions', () => {
      expect(UPLOAD_CONFIG.blockedExtensions).toContain('.exe');
      expect(UPLOAD_CONFIG.blockedExtensions).toContain('.bat');
      expect(UPLOAD_CONFIG.blockedExtensions).toContain('.php');
    });
  });

  describe('isAllowedFileType', () => {
    it('should allow common image types', () => {
      expect(isAllowedFileType('image/jpeg')).toBe(true);
      expect(isAllowedFileType('image/png')).toBe(true);
      expect(isAllowedFileType('image/webp')).toBe(true);
    });

    it('should allow PDF', () => {
      expect(isAllowedFileType('application/pdf')).toBe(true);
    });

    it('should block executable types', () => {
      expect(isAllowedFileType('application/x-executable')).toBe(false);
      expect(isAllowedFileType('application/javascript')).toBe(false);
    });
  });

  describe('isBlockedExtension', () => {
    it('should block executable extensions', () => {
      expect(isBlockedExtension('malware.exe')).toBe(true);
      expect(isBlockedExtension('script.bat')).toBe(true);
      expect(isBlockedExtension('shell.sh')).toBe(true);
    });

    it('should allow safe extensions', () => {
      expect(isBlockedExtension('document.pdf')).toBe(false);
      expect(isBlockedExtension('photo.jpg')).toBe(false);
      expect(isBlockedExtension('data.csv')).toBe(false);
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate a safe filename with timestamp prefix', () => {
      const safeName = generateSafeFilename('test file.jpg');
      expect(safeName).toMatch(/^\d+_[a-z0-9]+_test_file\.jpg\.jpg$/);
    });

    it('should sanitize special characters', () => {
      const safeName = generateSafeFilename('file with spaces & special chars!.pdf');
      expect(safeName).not.toContain('&');
      expect(safeName).not.toContain('!');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(100) + '.pdf';
      const safeName = generateSafeFilename(longName);
      // After sanitization, the base name part should be truncated to 50 chars
      expect(safeName.length).toBeLessThan(longName.length);
    });
  });
});
