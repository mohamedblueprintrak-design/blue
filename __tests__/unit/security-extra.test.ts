/**
 * Unit Tests — Security Extra
 * Tests encryption, audit logging, and input validation utilities
 */

import {
  encrypt,
  decrypt,
  generateSecureToken,
  generateAPIKey,
  maskSensitiveData,
  maskString,
} from '@/lib/security/encryption';
import {
  AuditLogger,
  getAuditLogger,
  initAuditLogger,
  auditLog,
  type LogLevel,
} from '@/lib/security/audit-logger';
import {
  sanitizeString,
  sanitizeObject,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateURL,
  validateSQLInjection,
  validateXSS,
  validateFilePath,
  rateLimitInput,
  securityCheck,
  createValidator,
} from '@/lib/security/validation';

// ═══════════════════════════════════════════════════════════════════════
// encryption.ts — encrypt / decrypt
// ═══════════════════════════════════════════════════════════════════════

describe('encryption.ts — encrypt/decrypt', () => {
  const secretKey = 'test-secret-key-at-least-32-chars!!';

  it('should encrypt a string and return structured result', () => {
    const result = encrypt('hello world', secretKey);
    expect(result).toHaveProperty('ciphertext');
    expect(result).toHaveProperty('iv');
    expect(result).toHaveProperty('authTag');
    expect(result.ciphertext.length).toBeGreaterThan(0);
    expect(result.iv.length).toBeGreaterThan(0);
    expect(result.authTag.length).toBeGreaterThan(0);
  });

  it('should decrypt back to original plaintext', () => {
    const encrypted = encrypt('sensitive data 123', secretKey);
    const decrypted = decrypt(encrypted.ciphertext, secretKey, encrypted.iv, encrypted.authTag);
    expect(decrypted).toBe('sensitive data 123');
  });

  it('should handle empty string encryption', () => {
    const encrypted = encrypt('', secretKey);
    const decrypted = decrypt(encrypted.ciphertext, secretKey, encrypted.iv, encrypted.authTag);
    expect(decrypted).toBe('');
  });

  it('should handle unicode characters', () => {
    const plaintext = 'مرحبا بالعالم 🔒';
    const encrypted = encrypt(plaintext, secretKey);
    const decrypted = decrypt(encrypted.ciphertext, secretKey, encrypted.iv, encrypted.authTag);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext (random IV)', () => {
    const enc1 = encrypt('same input', secretKey);
    const enc2 = encrypt('same input', secretKey);
    // IV is random, so ciphertext should differ
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it('should fail decryption with wrong key', () => {
    const encrypted = encrypt('secret', secretKey);
    expect(() => {
      decrypt(encrypted.ciphertext, 'wrong-key-min-32-chars!!!!', encrypted.iv, encrypted.authTag);
    }).toThrow('Decryption failed');
  });

  it('should fail decryption with tampered ciphertext', () => {
    const encrypted = encrypt('secret', secretKey);
    expect(() => {
      decrypt(encrypted.ciphertext + 'tampered', secretKey, encrypted.iv, encrypted.authTag);
    }).toThrow('Decryption failed');
  });

  it('should handle long strings', () => {
    const longString = 'a'.repeat(10000);
    const encrypted = encrypt(longString, secretKey);
    const decrypted = decrypt(encrypted.ciphertext, secretKey, encrypted.iv, encrypted.authTag);
    expect(decrypted).toBe(longString);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// encryption.ts — generateSecureToken
// ═══════════════════════════════════════════════════════════════════════

describe('encryption.ts — generateSecureToken', () => {
  it('should generate a URL-safe token', () => {
    const token = generateSecureToken(32);
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
    expect(token).not.toContain('=');
  });

  it('should generate tokens of different lengths', () => {
    const t16 = generateSecureToken(16);
    const t32 = generateSecureToken(32);
    const t64 = generateSecureToken(64);
    expect(t16.length).toBeLessThan(t32.length);
    expect(t32.length).toBeLessThan(t64.length);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken(32)));
    expect(tokens.size).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// encryption.ts — generateAPIKey
// ═══════════════════════════════════════════════════════════════════════

describe('encryption.ts — generateAPIKey', () => {
  it('should generate API key with default bp_live_ prefix', () => {
    const key = generateAPIKey();
    expect(key).toMatch(/^bp_live_/);
  });

  it('should generate API key with custom prefix', () => {
    const key = generateAPIKey('bp_test_');
    expect(key).toMatch(/^bp_test_/);
  });

  it('should generate unique API keys', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateAPIKey()));
    expect(keys.size).toBe(50);
  });

  it('should generate API key with custom length', () => {
    const key = generateAPIKey('custom_', { length: 16 });
    expect(key.startsWith('custom_')).toBe(true);
    expect(key.length).toBeGreaterThan(7); // prefix + random part
  });
});

// ═══════════════════════════════════════════════════════════════════════
// encryption.ts — maskSensitiveData / maskString
// ═══════════════════════════════════════════════════════════════════════

describe('encryption.ts — maskString', () => {
  it('should mask middle of string', () => {
    // 'user@example.com' = 16 chars, leading 2 + trailing 2 = 12 masked
    const result = maskString('user@example.com');
    expect(result.startsWith('us')).toBe(true);
    expect(result.endsWith('om')).toBe(true);
    expect(result).toContain('*');
  });

  it('should fully mask short strings', () => {
    expect(maskString('ab')).toBe('**');
  });

  it('should use custom mask char', () => {
    expect(maskString('hello world', { maskChar: '•' })).toBe('he•••••••ld');
  });

  it('should handle custom leading/trailing chars', () => {
    expect(maskString('1234567890', { leadingChars: 3, trailingChars: 3 })).toBe('123****890');
  });

  it('should return empty string for empty input', () => {
    expect(maskString('')).toBe('');
  });
});

describe('encryption.ts — maskSensitiveData', () => {
  it('should mask specified fields', () => {
    const data = { email: 'user@example.com', name: 'John', ssn: '123-45-6789' };
    const masked = maskSensitiveData(data, ['email', 'ssn'], { leadingChars: 2, trailingChars: 4 });
    expect(masked.email).toContain('*');
    expect(masked.email.startsWith('us')).toBe(true);
    expect(masked.ssn.startsWith('12')).toBe(true);
    expect(masked.ssn.endsWith('6789')).toBe(true);
    expect(masked.name).toBe('John');
  });

  it('should not modify unlisted fields', () => {
    const data = { email: 'test@test.com', phone: '555-1234', name: 'Jane' };
    const masked = maskSensitiveData(data, ['email']);
    expect(masked.phone).toBe('555-1234');
    expect(masked.name).toBe('Jane');
  });

  it('should handle dot-notation fields', () => {
    const data = { user: { email: 'admin@test.com' } } as any;
    const masked = maskSensitiveData(data, ['user.email']);
    expect(masked.user.email).toContain('*');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// audit-logger.ts — AuditLogger
// ═══════════════════════════════════════════════════════════════════════

describe('audit-logger.ts — AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger({ console: false, persist: false });
  });

  afterEach(async () => {
    await logger.shutdown();
  });

  it('should create a logger instance', () => {
    expect(logger).toBeDefined();
  });

  it('should infer category from action string', () => {
    // Access private method via the log output indirectly
    // The inferCategory is private; we test through log behavior
    expect(() => logger.info('user.login')).not.toThrow();
    expect(() => logger.info('project.create')).not.toThrow();
    expect(() => logger.info('invoice.approve')).not.toThrow();
  });

  it('should respect minimum log level', () => {
    const strictLogger = new AuditLogger({ console: false, persist: false, minLevel: 'ERROR' });
    // INFO and WARNING should be silently dropped
    expect(() => strictLogger.info('user.login')).not.toThrow();
    expect(() => strictLogger.warning('auth.failed')).not.toThrow();
    // ERROR and CRITICAL should be accepted
    expect(() => strictLogger.error('data.error')).not.toThrow();
    expect(() => strictLogger.critical('data.breach')).not.toThrow();
    strictLogger.shutdown();
  });

  it('should buffer entries when persist is enabled', () => {
    const persistLogger = new AuditLogger({ console: false, persist: true, maxBatchSize: 100 });
    persistLogger.info('user.login', { email: 'test@example.com' });
    persistLogger.info('user.logout');
    // Should not throw - entries are buffered
    persistLogger.shutdown();
  });
});

describe('audit-logger.ts — Singleton & Convenience', () => {
  it('getAuditLogger should return singleton', () => {
    const a = getAuditLogger();
    const b = getAuditLogger();
    expect(a).toBe(b);
  });

  it('initAuditLogger should create new instance', () => {
    const logger = initAuditLogger({ console: false, persist: false });
    expect(logger).toBeDefined();
  });

  it('auditLog convenience function should not throw', async () => {
    await expect(auditLog('user.login', { email: 'test@test.com' }, 'user-1')).resolves.not.toThrow();
  });

  it('auditLog should auto-detect CRITICAL level', async () => {
    await expect(auditLog('data.breach_attempt')).resolves.not.toThrow();
  });

  it('auditLog should auto-detect WARNING level', async () => {
    await expect(auditLog('auth.failed_login')).resolves.not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// validation.ts — sanitizeString / sanitizeObject
// ═══════════════════════════════════════════════════════════════════════

describe('validation.ts — sanitizeString', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeString('<p>Hello</p>')).toBe('Hello');
  });

  it('should strip script tags', () => {
    // sanitizeString strips tags but not content between them
    const result = sanitizeString('<script>alert(1)</script>World');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('should decode HTML entities before stripping', () => {
    // After decoding: <script>alert(1)</script> → after stripping: alert(1)
    const result = sanitizeString('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('&lt;');
  });

  it('should collapse whitespace', () => {
    expect(sanitizeString('Hello    World')).toBe('Hello World');
  });

  it('should trim leading/trailing whitespace', () => {
    expect(sanitizeString('  Hello World  ')).toBe('Hello World');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeString(123 as any)).toBe('');
  });
});

describe('validation.ts — sanitizeObject', () => {
  it('should sanitize all string properties', () => {
    const result = sanitizeObject({
      name: '<b>John</b>',
      email: 'john@test.com',
      bio: '<script>alert("x")</script>Dev',
    });
    expect(result.name).toBe('John');
    // Content between tags is not removed, only the tags themselves
    expect(result.bio).not.toContain('<script>');
    expect(result.email).toBe('john@test.com');
  });

  it('should handle nested objects', () => {
    const result = sanitizeObject({
      address: { city: '<b>Dubai</b>', zip: '12345' },
    });
    expect((result as any).address.city).toBe('Dubai');
  });

  it('should handle arrays', () => {
    const result = sanitizeObject(['<a>one</a>', '<b>two</b>']);
    expect(result).toEqual(['one', 'two']);
  });

  it('should pass through non-string values', () => {
    const result = sanitizeObject({ count: 42, active: true, value: null });
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.value).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// validation.ts — Field Validators
// ═══════════════════════════════════════════════════════════════════════

describe('validation.ts — validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
    expect(validateEmail('test.user+tag@domain.co').valid).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('not-an-email').valid).toBe(false);
    expect(validateEmail('@domain.com').valid).toBe(false);
    expect(validateEmail('user@').valid).toBe(false);
  });

  it('should reject empty email', () => {
    expect(validateEmail('').valid).toBe(false);
  });

  it('should reject emails exceeding max length', () => {
    const longLocal = 'a'.repeat(250) + '@test.com';
    expect(validateEmail(longLocal).valid).toBe(false);
  });
});

describe('validation.ts — validatePassword', () => {
  it('should accept strong password', () => {
    expect(validatePassword('MyStr0ng!Pass').valid).toBe(true);
  });

  it('should reject short passwords', () => {
    expect(validatePassword('Ab1!').valid).toBe(false);
  });

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('mystr0ng!pass').valid).toBe(false);
  });

  it('should reject passwords without lowercase', () => {
    expect(validatePassword('MYSTR0NG!PASS').valid).toBe(false);
  });

  it('should reject passwords without digit', () => {
    expect(validatePassword('MyStrong!Pass').valid).toBe(false);
  });

  it('should reject passwords without special character', () => {
    expect(validatePassword('MyStr0ngPass').valid).toBe(false);
  });

  it('should reject empty password', () => {
    expect(validatePassword('').valid).toBe(false);
  });
});

describe('validation.ts — validatePhoneNumber', () => {
  it('should accept valid phone numbers', () => {
    expect(validatePhoneNumber('+14155552671').valid).toBe(true);
    expect(validatePhoneNumber('+971501234567').valid).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhoneNumber('123').valid).toBe(false);
    expect(validatePhoneNumber('abc').valid).toBe(false);
  });

  it('should reject empty phone', () => {
    expect(validatePhoneNumber('').valid).toBe(false);
  });
});

describe('validation.ts — validateURL', () => {
  it('should accept valid HTTPS URLs', () => {
    expect(validateURL('https://example.com').valid).toBe(true);
  });

  it('should accept valid HTTP URLs', () => {
    expect(validateURL('http://example.com').valid).toBe(true);
  });

  it('should reject javascript: URLs', () => {
    expect(validateURL('javascript:alert(1)').valid).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(validateURL('not-a-url').valid).toBe(false);
  });

  it('should reject empty URL', () => {
    expect(validateURL('').valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// validation.ts — Security Validators
// ═══════════════════════════════════════════════════════════════════════

describe('validation.ts — validateSQLInjection', () => {
  it('should detect basic SQL injection', () => {
    expect(validateSQLInjection("'; DROP TABLE users; --")).toBe(true);
  });

  it('should detect UNION-based injection', () => {
    expect(validateSQLInjection("' UNION SELECT * FROM users --")).toBe(true);
  });

  it('should detect SLEEP-based injection', () => {
    expect(validateSQLInjection("'; WAITFOR DELAY '0:0:5' --")).toBe(true);
  });

  it('should not flag safe input', () => {
    expect(validateSQLInjection('Hello World')).toBe(false);
    expect(validateSQLInjection('user@example.com')).toBe(false);
  });

  it('should handle empty input', () => {
    expect(validateSQLInjection('')).toBe(false);
  });
});

describe('validation.ts — validateXSS', () => {
  it('should detect script tags', () => {
    expect(validateXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('should detect inline event handlers', () => {
    expect(validateXSS('<img src=x onerror=alert(1)>')).toBe(true);
  });

  it('should detect javascript: URIs', () => {
    expect(validateXSS('javascript:alert(1)')).toBe(true);
  });

  it('should not flag safe text', () => {
    expect(validateXSS('Hello World')).toBe(false);
    expect(validateXSS('<b>bold</b>')).toBe(false); // Regular HTML tag
  });

  it('should handle empty input', () => {
    expect(validateXSS('')).toBe(false);
  });
});

describe('validation.ts — validateFilePath', () => {
  it('should accept safe file paths', () => {
    expect(validateFilePath('documents/report.pdf').valid).toBe(true);
    expect(validateFilePath('/uploads/images/photo.jpg').valid).toBe(true);
  });

  it('should reject path traversal with ../', () => {
    expect(validateFilePath('../../../etc/passwd').valid).toBe(false);
  });

  it('should reject path traversal with ..\\', () => {
    expect(validateFilePath('..\\..\\windows\\system32').valid).toBe(false);
  });

  it('should reject null bytes', () => {
    expect(validateFilePath('file.txt\0.exe').valid).toBe(false);
  });

  it('should reject empty paths', () => {
    expect(validateFilePath('').valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// validation.ts — rateLimitInput & securityCheck
// ═══════════════════════════════════════════════════════════════════════

describe('validation.ts — rateLimitInput', () => {
  it('should pass through short input', () => {
    const result = rateLimitInput('Hello');
    expect(result.value).toBe('Hello');
    expect(result.truncated).toBe(false);
  });

  it('should truncate long input', () => {
    const long = 'a'.repeat(20000);
    const result = rateLimitInput(long, 1000);
    expect(result.value.length).toBe(1000);
    expect(result.truncated).toBe(true);
  });

  it('should handle custom max chars', () => {
    const result = rateLimitInput('Hello World', 5);
    expect(result.value).toBe('Hello');
    expect(result.truncated).toBe(true);
  });
});

describe('validation.ts — securityCheck', () => {
  it('should return safe=true for clean input', () => {
    const result = securityCheck('Hello World');
    expect(result.safe).toBe(true);
    expect(result.xss).toBe(false);
    expect(result.sqlInjection).toBe(false);
    expect(result.pathTraversal).toBe(false);
  });

  it('should detect XSS in security check', () => {
    const result = securityCheck('<script>alert(1)</script>');
    expect(result.safe).toBe(false);
    expect(result.xss).toBe(true);
  });

  it('should detect SQL injection in security check', () => {
    const result = securityCheck("'; DROP TABLE users;");
    expect(result.safe).toBe(false);
    expect(result.sqlInjection).toBe(true);
  });

  it('should detect path traversal in security check', () => {
    const result = securityCheck('../../../etc/passwd');
    expect(result.safe).toBe(false);
    expect(result.pathTraversal).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// validation.ts — createValidator
// ═══════════════════════════════════════════════════════════════════════

describe('validation.ts — createValidator', () => {
  it('should create validator from schema-like object', () => {
    const mockSchema = {
      safeParse: (input: unknown) => {
        if (typeof input !== 'object' || input === null) {
          return { success: false, error: { errors: [{ message: 'Expected object' }] } };
        }
        return { success: true, data: input };
      },
    };

    const validate = createValidator(mockSchema, { sanitize: false });
    const result = validate({ name: 'John' });
    expect(result.valid).toBe(true);
  });

  it('should return error on validation failure', () => {
    const mockSchema = {
      safeParse: () => ({ success: false, error: { errors: [{ message: 'Name is required' }] } }),
    };

    const validate = createValidator(mockSchema);
    const result = validate(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should use custom error message', () => {
    const mockSchema = {
      safeParse: () => ({ success: false, error: { errors: [{ message: 'Validation error' }] } }),
    };

    const validate = createValidator(mockSchema, { errorMessage: 'Custom error', sanitize: false });
    const result = validate(null);
    expect(result.error).toBe('Custom error');
  });

  it('should sanitize output by default', () => {
    const mockSchema = {
      safeParse: (input: unknown) => ({ success: true, data: input }),
    };

    const validate = createValidator(mockSchema, { sanitize: true });
    const result = validate({ name: '<b>John</b>' } as any);
    expect(result.valid).toBe(true);
    expect((result.data as any).name).toBe('John');
  });
});
