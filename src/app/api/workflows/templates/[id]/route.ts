import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/workflows/templates/[id] - Get template
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await db.workflowTemplate.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
