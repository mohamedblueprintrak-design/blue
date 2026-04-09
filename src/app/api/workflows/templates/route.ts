import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createWorkflowTemplate, seedDefaultWorkflowTemplates } from '@/lib/workflow-engine';

// POST /api/workflows/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const template = await createWorkflowTemplate(body);
    return NextResponse.json(template, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/workflows/templates - List templates
export async function GET() {
  try {
    const templates = await db.workflowTemplate.findMany({
      where: { isActive: true },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
