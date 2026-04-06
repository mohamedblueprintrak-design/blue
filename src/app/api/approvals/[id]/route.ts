import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Get a single approval
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const approval = await db.approval.findUnique({ where: { id } });
  if (!approval) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
  }
  return NextResponse.json(approval);
}

// PATCH: Update approval (approve, reject, forward to next step)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const existing = await db.approval.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
  }

  // If approving, check if there are more steps in the workflow
  let newStep = existing.step;
  let newStatus = status || existing.status;
  let newNotes = existing.notes;

  if (status === 'approved' && existing.step < existing.totalSteps) {
    // Multi-step: forward to next step, keep status as pending
    newStep = existing.step + 1;
    newStatus = 'pending';

    // Append step note if provided
    if (notes) {
      const stepNote = `[${existing.step}/${existing.totalSteps}] ${notes}`;
      newNotes = existing.notes
        ? `${existing.notes}\n---\n${stepNote}`
        : stepNote;
    }
  } else if (status === 'approved' && existing.step >= existing.totalSteps) {
    // Final step: fully approved
    newStatus = 'approved';

    // Append final approval note
    if (notes) {
      const finalNote = `[${existing.step}/${existing.totalSteps} Approved] ${notes}`;
      newNotes = existing.notes
        ? `${existing.notes}\n---\n${finalNote}`
        : finalNote;
    }
  } else if (status === 'rejected') {
    // Rejected at current step
    newStatus = 'rejected';

    if (notes) {
      const rejectNote = `[${existing.step}/${existing.totalSteps} Rejected] ${notes}`;
      newNotes = existing.notes
        ? `${existing.notes}\n---\n${rejectNote}`
        : rejectNote;
    }
  }

  const updated = await db.approval.update({
    where: { id },
    data: {
      status: newStatus,
      step: newStep,
      notes: newNotes,
    },
  });

  return NextResponse.json(updated);
}
