import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { AuthenticatedUser, DemoUser } from '../types';
import { getDb } from './db';
import { getJwtSecretBytes as _getJwtSecretBytes } from '@/lib/auth/jwt-secret';

// ============================================
// Security Configuration
// ============================================

// JWT secret is now managed centrally in @/lib/auth/jwt-secret

// Export JWT_SECRET as a function that returns Uint8Array
// This allows lazy evaluation and prevents build-time errors
export function getJWTSecret(): Uint8Array {
  return _getJwtSecretBytes();
}

/**
 * Extract JWT token from request headers
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Skip the 'httpOnly' placeholder — real JWT is in the cookie
    if (token === 'httpOnly') {
      const tokenCookie = request.cookies.get('blue_token');
      return tokenCookie?.value || null;
    }
    return token;
  }
  // Fall back to httpOnly cookie
  const tokenCookie = request.cookies.get('blue_token');
  return tokenCookie?.value || null;
}

/**
 * Verify JWT token and extract user information
 */
export async function getUserFromToken(request: NextRequest, demoUsers: DemoUser[]): Promise<AuthenticatedUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    const userId = payload.userId as string;
    
    // Check demo users first
    const demoUser = demoUsers.find(u => u.id === userId);
    if (demoUser) {
      return { ...demoUser, organization: demoUser.organization };
    }
    
    // Then try database
    try {
      const database = await getDb();
      if (!database) return null;
      
      const user = await database.user.findUnique({ 
        where: { id: userId },
        include: { organization: true }
      });
      return user;
    } catch {
      console.warn('Database not available, using demo mode');
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: string): Promise<string> {
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(getJWTSecret());
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
  demoUsers: DemoUser[]
): Promise<{ user: AuthenticatedUser } | { error: ReturnType<typeof import('../utils/response').unauthorizedResponse> }> {
  const user = await getUserFromToken(request, demoUsers);
  if (!user) {
    const { unauthorizedResponse } = await import('../utils/response');
    return { error: unauthorizedResponse() };
  }
  return { user };
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'ADMIN' || user.role === 'admin';
}

/**
 * Check if user has HR role
 */
export function isHR(user: AuthenticatedUser): boolean {
  return user.role === 'HR' || user.role === 'hr';
}

/**
 * Check if user has accountant role
 */
export function isAccountant(user: AuthenticatedUser): boolean {
  return user.role === 'ACCOUNTANT' || user.role === 'accountant';
}

/**
 * Check if user can approve leaves
 */
export function canApproveLeave(user: AuthenticatedUser): boolean {
  const r = user.role?.toUpperCase();
  return r === 'ADMIN' || r === 'HR' || r === 'MANAGER';
}

/**
 * Check if user can approve expenses
 */
export function canApproveExpense(user: AuthenticatedUser): boolean {
  const r = user.role?.toUpperCase();
  return r === 'ADMIN' || r === 'ACCOUNTANT' || r === 'MANAGER';
}

/**
 * Check if user's email is verified
 * Returns true for demo users (they are considered verified)
 */
export async function isEmailVerified(user: AuthenticatedUser): Promise<boolean> {
  // Demo users are considered verified
  if ('isDemo' in user && typeof (user as Record<string, unknown>).isDemo === 'boolean') {
    return (user as Record<string, unknown>).isDemo as boolean;
  }

  try {
    const database = await getDb();
    if (!database) return true; // If no DB, allow access (demo mode)
    
    const dbUser = await database.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });
    
    return !!dbUser?.emailVerified;
  } catch {
    // SECURITY: Fail closed on DB errors for email verification
    // In production, always require email verification
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // In development/demo mode, allow access when DB is unavailable
    return true;
  }
}

/**
 * Middleware to require email verification
 * Use this for sensitive operations like payments, changing password, etc.
 */
export async function requireEmailVerified(
  user: AuthenticatedUser
): Promise<{ verified: true } | { verified: false; error: ReturnType<typeof import('../utils/response').errorResponse> }> {
  const verified = await isEmailVerified(user);
  
  if (!verified) {
    const { errorResponse } = await import('../utils/response');
    return {
      verified: false,
      error: errorResponse(
        'يجب التحقق من بريدك الإلكتروني أولاً',
        'EMAIL_NOT_VERIFIED',
        403
      ),
    };
  }
  
  return { verified: true };
}

/**
 * Combined middleware: require auth + email verified
 */
export async function requireAuthAndVerified(
  request: NextRequest,
  demoUsers: DemoUser[]
): Promise<
  { user: AuthenticatedUser } | 
  { error: ReturnType<typeof import('../utils/response').unauthorizedResponse> | ReturnType<typeof import('../utils/response').errorResponse> }
> {
  const authResult = await requireAuth(request, demoUsers);
  
  if ('error' in authResult) {
    return authResult;
  }
  
  const verifiedResult = await requireEmailVerified(authResult.user);
  
  if ('error' in verifiedResult) {
    return { error: verifiedResult.error };
  }
  
  return { user: authResult.user };
}
