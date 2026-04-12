import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const DEV_JWT_SECRET = 'blueprint-dev-secret-do-not-use-in-production-min32chars!';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(DEV_JWT_SECRET);
}

/**
 * GET /api/auth/session
 * Returns current user session info from httpOnly cookie.
 * This is the primary way for the client to check authentication status.
 */
export async function GET(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get('blue_token');
    if (!tokenCookie?.value) {
      return NextResponse.json(
        { success: false, user: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    const { payload } = await jwtVerify(tokenCookie.value, getJwtSecret());
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { success: false, user: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, user: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      isAuthenticated: true,
    });
  } catch {
    return NextResponse.json(
      { success: false, user: null, isAuthenticated: false },
      { status: 200 }
    );
  }
}
