import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateBody, approvalCreateSchema } from '@/lib/api-validation';

// GET: List all approvals with optional filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const entityType = searchParams.get('entityType');

  const projectId = searchParams.get('projectId');

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') where.status = status;
  if (entityType && entityType !== 'all') where.entityType = entityType;
  if (projectId) where.projectId = projectId;

  const approvals = await db.approval.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(approvals);
}

// POST: Create a new approval request
export async function POST(request: NextRequest) {
  const body = await validateBody(request, approvalCreateSchema);
  if (body instanceof NextResponse) return body;
  const { entityType, entityId, title, description, requestedBy, assignedTo, step, totalSteps, amount } = body;

  const approval = await db.approval.create({
    data: {
      entityType,
      entityId,
      title,
      description: description || '',
      requestedBy,
      assignedTo,
      step: step || 1,
      totalSteps: totalSteps || 1,
      amount: amount || 0,
    },
  });

  return NextResponse.json(approval, { status: 201 });
}
