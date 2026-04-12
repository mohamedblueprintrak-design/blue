import { NextResponse } from 'next/server';

const COOKIE_NAME = 'blue_token';

/**
 * POST /api/auth/logout
 * Clears the httpOnly auth cookie, effectively logging the user out.
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set(COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}

/**
 * GET /api/auth/logout
 * Also supports GET for simpler client-side redirect flows.
 */
export async function GET() {
  return POST();
}
