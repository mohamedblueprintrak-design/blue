import { NextRequest, NextResponse } from 'next/server';
import { executeStepAction } from '@/lib/workflow-engine';

// POST /api/projects/[id]/workflow/stages/[stageId]/steps/[stepId]/action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await request.json();
    const { action, userId, notes, returnReason, severity } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'action and userId are required' }, { status: 400 });
    }

    const validActions = ['start', 'approve', 'complete', 'reject', 'request_changes'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await executeStepAction(stepId, action, userId, { notes, returnReason, severity });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to execute step action';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
