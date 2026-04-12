/**
 * Unit Tests — Encryption (Batch 2)
 * Tests password hashing, verification, data encryption/decryption,
 * token generation, and random string generation.
 * Imports actual functions from src/lib/security/encryption.ts
 */

import {
  encrypt,
  decrypt,
  generateSecureToken,
  generateAPIKey,
  hashPassword,
  verifyPassword,
  maskString,
  maskSensitiveData,
} from '@/lib/security/encryption';

// ─── Password Hashing (bcrypt / scrypt) ───────────────────────────────────

describe('Encryption — Password Hashing', () => {
  it('should hash a password and return a string', async () => {
    const hash = await hashPassword('MyS3curePass!');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should use $blueprint$ prefix format', async () => {
    const hash = await hashPassword('TestPass123');
    expect(hash.startsWith('$blueprint$')).toBe(true);
  });

  it('should produce different hashes for the same password (random salt)', async () => {
    const h1 = await hashPassword('samePass');
    const h2 = await hashPassword('samePass');
    expect(h1).not.toBe(h2);
  });

  it('should throw for empty password', async () => {
    await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
  });

  it('should include rounds in hash output', async () => {
    const hash = await hashPassword('test', { rounds: 10 });
    expect(hash).toContain('$blueprint$10$');
  });
});

describe('Encryption — Password Verification', () => {
  it('should verify correct password returns true', async () => {
    const hash = await hashPassword('CorrectPass1!');
    expect(await verifyPassword('CorrectPass1!', hash)).toBe(true);
  });

  it('should reject incorrect password returns false', async () => {
    const hash = await hashPassword('CorrectPass1!');
    expect(await verifyPassword('WrongPass2!', hash)).toBe(false);
  });

  it('should return false for empty password', async () => {
    expect(await verifyPassword('', '$blueprint$12$salt$hash')).toBe(false);
  });

  it('should return false for empty hash', async () => {
    expect(await verifyPassword('password', '')).toBe(false);
  });

  it('should return false for unknown hash format', async () => {
    expect(await verifyPassword('pass', 'invalid_format')).toBe(false);
  });
});

// ─── Data Encryption / Decryption Cycles ──────────────────────────────────

describe('Encryption — AES-256-GCM Encrypt/Decrypt', () => {
  const KEY = 'test-encryption-key-min-32-chars-long!!';

  it('should return ciphertext, iv, and authTag from encrypt()', () => {
    const result = encrypt('hello', KEY);
    expect(result).toHaveProperty('ciphertext');
    expect(result).toHaveProperty('iv');
    expect(result).toHaveProperty('authTag');
  });

  it('should decrypt back to the original plaintext', () => {
    const original = 'sensitive data 123';
    const enc = encrypt(original, KEY);
    const dec = decrypt(enc.ciphertext, KEY, enc.iv, enc.authTag);
    expect(dec).toBe(original);
  });

  it('should produce different IVs each call (randomness)', () => {
    const r1 = encrypt('same', KEY);
    const r2 = encrypt('same', KEY);
    expect(r1.iv).not.toBe(r2.iv);
  });

  it('should throw on wrong decryption key', () => {
    const enc = encrypt('secret', KEY);
    expect(() =>
      decrypt(enc.ciphertext, 'wrong-key-min-32-chars-long!!!!', enc.iv, enc.authTag)
    ).toThrow('Decryption failed');
  });

  it('should throw on tampered authTag', () => {
    const enc = encrypt('secret', KEY);
    expect(() =>
      decrypt(enc.ciphertext, KEY, enc.iv, 'x' + enc.authTag)
    ).toThrow('Decryption failed');
  });

  it('should survive multiple encrypt-decrypt cycles', () => {
    const original = 'cycle test data';
    let current = original;
    for (let i = 0; i < 5; i++) {
      const enc = encrypt(current, KEY);
      current = decrypt(enc.ciphertext, KEY, enc.iv, enc.authTag);
    }
    expect(current).toBe(original);
  });

  it('should encrypt/decrypt unicode and Arabic text', () => {
    const original = 'مرحبا بالعالم 🌍';
    const enc = encrypt(original, KEY);
    expect(decrypt(enc.ciphertext, KEY, enc.iv, enc.authTag)).toBe(original);
  });

  it('should encrypt/decrypt JSON strings', () => {
    const original = JSON.stringify({ key: 'value', num: 42 });
    const enc = encrypt(original, KEY);
    expect(JSON.parse(decrypt(enc.ciphertext, KEY, enc.iv, enc.authTag))).toEqual({ key: 'value', num: 42 });
  });
});

// ─── Token Generation ──────────────────────────────────────────────────────

describe('Encryption — Token Generation', () => {
  it('generateSecureToken should return a string', () => {
    expect(typeof generateSecureToken()).toBe('string');
  });

  it('should produce URL-safe tokens (no +, /, =)', () => {
    for (let i = 0; i < 10; i++) {
      const token = generateSecureToken();
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    }
  });

  it('should generate unique tokens', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateSecureToken()));
    expect(tokens.size).toBe(200);
  });

  it('should respect custom length parameter', () => {
    const short = generateSecureToken(8);
    const long = generateSecureToken(64);
    expect(long.length).toBeGreaterThan(short.length);
  });

  it('generateAPIKey should have default bp_live_ prefix', () => {
    expect(generateAPIKey().startsWith('bp_live_')).toBe(true);
  });

  it('generateAPIKey should accept custom prefix', () => {
    expect(generateAPIKey('bp_test_').startsWith('bp_test_')).toBe(true);
  });

  it('generateAPIKey should be URL-safe', () => {
    const key = generateAPIKey();
    expect(key).not.toContain('+');
    expect(key).not.toContain('/');
  });
});

// ─── Random String / Data Masking ─────────────────────────────────────────

describe('Encryption — Random String & Masking', () => {
  it('maskString should hide middle characters', () => {
    const result = maskString('user@example.com', { leadingChars: 2, trailingChars: 3 });
    expect(result).toMatch(/^us.*com$/);
  });

  it('maskString should fully mask short strings', () => {
    expect(maskString('ab')).toBe('**');
  });

  it('maskSensitiveData should only mask specified fields', () => {
    const data = { email: 'a@b.com', name: 'John', phone: '1234567890' };
    const result = maskSensitiveData(data, ['email', 'phone']);
    expect(result.email).toMatch(/^a.*m$/);
    expect(result.name).toBe('John');
    expect((result as any).phone).toMatch(/^1.*0$/);
  });
});
