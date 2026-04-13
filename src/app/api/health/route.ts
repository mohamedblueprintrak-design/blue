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
    health.database = { status: 'connected', type: 'sqlite' };
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

  return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
