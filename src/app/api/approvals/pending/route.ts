import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Return pending approvals count
export async function GET() {
  const count = await db.approval.count({ where: { status: 'pending' } });
  return NextResponse.json({ count });
}
