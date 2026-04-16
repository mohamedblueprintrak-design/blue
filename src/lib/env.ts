/**
 * Environment Configuration
 * تكوين البيئة
 * 
 * Centralized environment variable access with validation
 */

// Required environment variables
// In production, JWT_SECRET is also mandatory (enforced in validate())
const requiredEnvVars = ['DATABASE_URL'] as const;

// Generate a deterministic dev-only JWT secret so the app works out-of-the-box locally.
// In production, JWT_SECRET MUST be set via environment (enforced below).
function generateDevSecret(): string {
  // Deterministic 48-char base64 string for local development only.
  // This is NOT secure — it only prevents the app from crashing in dev mode.
  return 'dev-only-do-not-use-in-prod-blueprint-secret-key-2024!';
}

// Optional environment variables with defaults
const envDefaults = {
  JWT_SECRET: process.env.NODE_ENV === 'development' ? generateDevSecret() : '',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NODE_ENV: 'development',
} as const;

/**
 * Get an environment variable with optional default
 */
function getEnvVar(key: string, defaultValue?: string): string | undefined {
  const value = process.env[key];
  if (value !== undefined) return value;
  return defaultValue;
}

/**
 * Environment configuration object
 */
export const env = {
  // Server
  NODE_ENV: getEnvVar('NODE_ENV', envDefaults.NODE_ENV),
  PORT: parseInt(getEnvVar('PORT', '3000')!, 10),
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL', ''),
  
  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET', envDefaults.JWT_SECRET)!,
  
  // App URL
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', envDefaults.NEXT_PUBLIC_APP_URL)!,
  
  // Email
  SMTP_HOST: getEnvVar('SMTP_HOST'),
  SMTP_PORT: getEnvVar('SMTP_PORT'),
  SMTP_USER: getEnvVar('SMTP_USER'),
  SMTP_PASS: getEnvVar('SMTP_PASS'),
  EMAIL_FROM: getEnvVar('EMAIL_FROM', 'noreply@blueprint.local'),
  
  // Security
  ENCRYPTION_KEY: getEnvVar('ENCRYPTION_KEY'),
  
  // Feature flags
  DEMO_MODE: getEnvVar('DEMO_MODE', 'true'),
  
  // Check if production
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
  
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  
  // Validate required env vars
  validate() {
    const missing: string[] = [];
    
    for (const key of requiredEnvVars) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
    
    // SECURITY: JWT_SECRET is mandatory in production
    // Must be at least 32 characters and not a placeholder value
    if (this.isProduction) {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.length < 32) {
        missing.push('JWT_SECRET (min 32 chars)');
      } else if (
        secret.includes('change-me') ||
        secret.includes('change_this') ||
        secret.includes('your_') ||
        secret.includes('dev-only') ||
        secret.includes('placeholder') ||
        secret === 'blueprint-dev-secret-do-not-use-in-production-min32chars!'
      ) {
        missing.push('JWT_SECRET (must not be a placeholder or dev secret)');
      }

      // SECURITY: NEXTAUTH_SECRET is mandatory in production (dual-auth system)
      const nextauthSecret = process.env.NEXTAUTH_SECRET;
      if (!nextauthSecret || nextauthSecret.length < 32) {
        missing.push('NEXTAUTH_SECRET (min 32 chars)');
      } else if (
        nextauthSecret.includes('change-me') ||
        nextauthSecret.includes('change_this') ||
        nextauthSecret.includes('your_') ||
        nextauthSecret.includes('dev-only') ||
        nextauthSecret.includes('placeholder')
      ) {
        missing.push('NEXTAUTH_SECRET (must not be a placeholder)');
      }
    }
    
    if (missing.length > 0 && this.isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}. Generate JWT_SECRET with: openssl rand -base64 48`);
    }
    
    return missing.length === 0;
  },
};

// Validate on import in production
if (env.isProduction) {
  env.validate();
}

export default env;
