import { NextRequest, NextResponse } from 'next/server';
import { assignStep } from '@/lib/workflow-engine';

// POST /api/projects/[id]/workflow/stages/[stageId]/steps/[stepId]/assign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = await assignStep(stepId, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to assign step';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
