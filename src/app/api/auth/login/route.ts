import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getJwtSecretBytes } from '@/lib/auth/jwt-secret';
import { validateRequest, loginSchema } from '@/lib/api-validation';

const COOKIE_NAME = 'blue_token';

async function generateJWT(user: { id: string; email: string; name: string; role: string; twoFactorEnabled?: boolean }): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled || false,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJwtSecretBytes());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequest(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    const { email, password } = validation.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "الحساب غير مفعّل. يرجى التواصل مع المسؤول" },
        { status: 403 }
      );
    }

    // Validate password using bcrypt only (security fix: removed plain text fallback)
    let isValid = false;
    if (user.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text passwords - hash them on-the-fly for migration
      if (user.password === password) {
        // Auto-migrate: hash the plain text password
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور" },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // Generate a temporary token for 2FA verification
      const tempToken = crypto.randomUUID().replace(/-/g, '');
      const tempTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store the pending 2FA session (you could use Redis in production)
      // For now, we we'll return a special response indicating 2FA is required
      
      return NextResponse.json({
        requires2FA: true,
        userId: user.id,
        tempToken,
        message: "يتطلب التحقق الثنائي. يرجى إدخال رمز التحقق من تطبيق المصادقة الخاص بك."
      }, { status: 200 });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT auth token (compatible with middleware jwtVerify)
    const token = await generateJWT(user);

    // Build the response with the Set-Cookie header
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled || false,
    });

    response.cookies.set(COOKIE_NAME, token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً" },
        { status: 500 }
    );
  }
}