/**
 * Centralized JWT Secret Management
 * إدارة مركزية لمفتاح JWT
 *
 * SECURITY: Single source of truth for JWT secret across the application
 * - Production: JWT_SECRET environment variable is MANDATORY
 * - Development: Falls back to a dev secret with warning
 *
 * All files that need JWT secret should import from this module.
 * Do NOT duplicate JWT secrets in individual files.
 */

let _warnedOnce = false;

/**
 * Get JWT secret as Uint8Array for jose library
 * SECURITY: JWT_SECRET is REQUIRED in production
 */
export function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;

  // Production: JWT_SECRET is MANDATORY
  if (nodeEnv === 'production') {
    if (!secret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is required in production. ' +
        'Generate one with: openssl rand -base64 48'
      );
    }
    if (secret.length < 32) {
      throw new Error(
        'FATAL: JWT_SECRET must be at least 32 characters long. ' +
        `Current length: ${secret.length}. Generate with: openssl rand -base64 48`
      );
    }
    // Reject known placeholder values in production
    if (
      secret.includes('change-me') ||
      secret.includes('change_this') ||
      secret.includes('your_') ||
      secret === 'blueprint-dev-secret-do-not-use-in-production-min32chars!'
    ) {
      throw new Error(
        'FATAL: JWT_SECRET appears to be a placeholder value. ' +
        'Generate a secure secret with: openssl rand -base64 48'
      );
    }
    return new TextEncoder().encode(secret);
  }

  // Development/Test: Allow dev secret with strong warning (only once)
  if (!secret || secret.length < 32) {
    if (!_warnedOnce) {
      console.warn(
        '\n' + '='.repeat(70) +
        '\n⚠️  SECURITY WARNING: JWT_SECRET is not properly configured!' +
        '\n   Using development-only secret. DO NOT use in production!' +
        '\n   Set JWT_SECRET in your .env file (min 32 characters)' +
        '\n   Generate with: openssl rand -base64 48' +
        '\n' + '='.repeat(70) + '\n'
      );
      _warnedOnce = true;
    }
    // Stable development-only fallback — NOT for production
    return new TextEncoder().encode('blueprint-dev-secret-do-not-use-in-production-min32chars!');
  }

  return new TextEncoder().encode(secret);
}

/**
 * Get JWT secret as a string (for compatibility with some libraries)
 */
export function getJwtSecretString(): string {
  const bytes = getJwtSecretBytes();
  return new TextDecoder().decode(bytes);
}
