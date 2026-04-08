import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/[id]/workflow/init - Init workflow for project
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { initWorkflow, seedDefaultWorkflowTemplates } = await import('@/lib/workflow-engine');

    // Ensure templates exist
    await seedDefaultWorkflowTemplates();

    // Init workflow
    const workflow = await initWorkflow(id);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to initialize workflow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/projects/[id]/workflow - Get project workflow
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await db.projectWorkflow.findUnique({
      where: { projectId: id },
      include: {
        template: true,
        stages: {
          orderBy: { order: 'asc' },
          include: {
            steps: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, avatar: true, role: true },
                },
              },
            },
            assignee: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ workflow: null });
    }

    // Recalculate progress
    const { getWorkflowProgress } = await import('@/lib/workflow-engine');
    const progress = await getWorkflowProgress(workflow.id);

    return NextResponse.json({
      ...workflow,
      progressData: progress,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch workflow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
