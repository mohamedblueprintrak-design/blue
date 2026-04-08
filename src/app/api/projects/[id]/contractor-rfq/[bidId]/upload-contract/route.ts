import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/[id]/contractor-rfq/[bidId]/upload-contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { bidId } = await params;
    const formData = await request.formData();
    const contractFile = formData.get('contractFile') as File | null;

    if (!contractFile) {
      return NextResponse.json({ error: 'contractFile is required' }, { status: 400 });
    }

    // Save file
    const bytes = await contractFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `contracts/${bidId}_${Date.now()}.pdf`;
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contracts');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, `${bidId}_${Date.now()}.pdf`), buffer);

    const bid = await db.bid.update({
      where: { id: bidId },
      data: {
        contractFile: `/uploads/${fileName}`,
        contractSignedAt: new Date(),
        isAwarded: true,
      },
    });

    // Optionally add to project documents
    const existingBid = await db.bid.findUnique({ where: { id: bidId } });
    if (existingBid?.projectId) {
      await db.document.create({
        data: {
          projectId: existingBid.projectId,
          name: `عقد مقاول - ${bid.contractorName}`,
          fileType: 'pdf',
          fileSize: buffer.length,
          category: 'contract',
          filePath: `/uploads/${fileName}`,
        },
      });
    }

    return NextResponse.json(bid);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload contract';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
