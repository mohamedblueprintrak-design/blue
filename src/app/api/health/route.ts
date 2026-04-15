import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const start = Date.now();
  const health: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  try {
    await db.user.count({ take: 1 });
    health.database = { 
      status: 'connected', 
      type: process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'sqlite' 
    };
  } catch (err) {
    health.database = { status: 'disconnected', error: (err as Error).message };
    health.status = 'degraded';
  }

  const mem = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
  };
  health.responseTime = `${Date.now() - start}ms`;

  // Check Redis connection
  health.redis = {
    configured: !!process.env.REDIS_URL,
    status: process.env.REDIS_URL ? 'configured' : 'not_configured'
  };

  // Check critical environment variables
  health.config = {
    jwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    encryptionKey: !!process.env.ENCRYPTION_KEY,
    demoMode: process.env.DEMO_MODE === 'true'
  };

  return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
