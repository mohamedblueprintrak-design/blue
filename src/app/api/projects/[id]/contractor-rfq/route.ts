import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/[id]/contractor-rfq - Send RFQ to selected contractors
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contractorIds, deadline } = await request.json();

    if (!contractorIds || contractorIds.length === 0) {
      return NextResponse.json({ error: 'contractorIds is required' }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create bids for each selected contractor
    const bids = await Promise.all(
      contractorIds.map(async (contractorId: string) => {
        const contractor = await db.contractor.findUnique({ where: { id: contractorId } });
        return db.bid.create({
          data: {
            projectId: id,
            contractorId,
            contractorName: contractor?.companyName || contractor?.name || '',
            contractorContact: contractor?.contactPerson || '',
            status: 'submitted',
            rfqStatus: 'sent',
            rfqSentAt: new Date(),
            deadline: deadline ? new Date(deadline) : null,
          },
        });
      })
    );

    return NextResponse.json({ bids, message: 'RFQ sent successfully' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send RFQ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
