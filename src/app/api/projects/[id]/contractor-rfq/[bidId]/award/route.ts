import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/[id]/contractor-rfq/[bidId]/award
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { id, bidId } = await params;

    const bid = await db.bid.findUnique({
      where: { id: bidId },
      include: { contractor: true },
    });

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Update the bid
    await db.bid.update({
      where: { id: bidId },
      data: {
        isAwarded: true,
        rfqStatus: 'awarded',
        status: 'accepted',
      },
    });

    // Reject other bids for this project
    await db.bid.updateMany({
      where: {
        projectId: id,
        id: { not: bidId },
      },
      data: {
        isAwarded: false,
        rfqStatus: 'rejected',
        status: 'rejected',
      },
    });

    // Update project contractor
    if (bid.contractorId) {
      await db.project.update({
        where: { id },
        data: { contractorId: bid.contractorId },
      });
    }

    return NextResponse.json({ message: 'Bid awarded successfully', bid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to award bid';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
