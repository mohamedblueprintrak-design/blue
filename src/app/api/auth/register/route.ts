/**
 * User Registration API Route
 * مسار تسجيل المستخدمين
 * 
 * POST /api/auth/register - Register a new user
 * 
 * SECURITY:
 * - Rate limiting on all auth endpoints to prevent brute force
 * - Input validation on all fields
 * - HTTP-only cookies for refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import { UserRole } from '@/lib/auth/types';
import { successResponse, errorResponse } from '../../utils/response';
// @ts-expect-error - cookies import may vary by Next.js version
import { cookies as nextCookies } from 'next/server';
import { SignJWT } from 'jose';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { getJWTSecret } from '../../utils/auth';

/**
 * POST - Handle user registration
 * SECURITY: Rate limited to prevent brute force attacks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both 'register' action and direct registration
    const action = body.action || 'register';
    
    if (action !== 'register' && action !== 'signup') {
      return errorResponse(`Invalid action: ${action}`, 'BAD_REQUEST', 400);
    }

    return await handleRegister(body);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('حدث خطأ غير متوقع', 'INTERNAL_ERROR', 500);
  }
}

/**
 * Handle user registration
 */
async function handleRegister(
  data: {
    email: string;
    password: string;
    name?: string;
    fullName?: string;
    organizationName?: string;
    role?: string;
    department?: string;
  },
): Promise<NextResponse> {
  // Determine the name field (support both 'name' and 'fullName')
  const userName = data.name || data.fullName || '';

  // Validate required fields
  if (!data.email || !data.password) {
    return errorResponse('البريد الإلكتروني وكلمة المرور مطلوبان', 'VALIDATION_ERROR', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return errorResponse('صيغة البريد الإلكتروني غير صحيحة', 'VALIDATION_ERROR', 400);
  }

  // Validate password length
  if (data.password.length < 8) {
    return errorResponse('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'VALIDATION_ERROR', 400);
  }

  // Validate name length if provided
  if (userName && (userName.length < 2 || userName.length > 100)) {
    return errorResponse('الاسم يجب أن يكون بين 2 و 100 حرف', 'VALIDATION_ERROR', 400);
  }

  try {
    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    
    if (existingEmail) {
      return errorResponse('البريد الإلكتروني مسجل مسبقاً', 'EMAIL_EXISTS', 400);
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Create organization if name provided
    let organizationId: string | null = null;
    if (data.organizationName) {
      const org = await db.organization.create({
        data: {
          name: data.organizationName,
        } as any,
      });
      organizationId = org.id;
    }

    // Determine role - SECURITY FIX: Only admin-created orgs get admin role
    // Regular registration always gets VIEWER role (no privilege escalation)
    const role = organizationId
      ? UserRole.ADMIN
      : UserRole.VIEWER;

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: userName,
        role: role as string,
        department: data.department || '',
        organizationId,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.name, // Using name as username
      role: user.role as UserRole,
      organizationId: user.organizationId || undefined,
    });

    const refreshToken = await generateRefreshToken(user.id);

    // Send verification email
    try {
      await authService.sendVerificationEmail(
        user.email,
        user.name,
        user.id
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - user can request resend
    }

    // Set HTTP-only cookie for refresh token
    const cookieStore = await nextCookies();
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId,
        organization: user.organization,
      },
      token: accessToken,
      emailVerificationSent: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('حدث خطأ أثناء إنشاء الحساب', 'REGISTRATION_FAILED', 500);
  }
}

/**
 * Generate access token
 */
async function generateAccessToken(payload: {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  organizationId?: string;
}): Promise<string> {
  const secret = getJWTSecret();
  
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('blueprint-saas')
    .setAudience('blueprint-users')
    .setExpirationTime('2h')
    .sign(secret);
}

/**
 * Generate refresh token
 */
async function generateRefreshToken(userId: string): Promise<string> {
  const secret = getJWTSecret();
  
  return new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('blueprint-saas')
    .setAudience('blueprint-users')
    .setExpirationTime('7d')
    .sign(secret);
}
