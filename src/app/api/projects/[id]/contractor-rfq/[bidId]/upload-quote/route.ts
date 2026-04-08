import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/[id]/contractor-rfq/[bidId]/upload-quote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { bidId } = await params;
    const formData = await request.formData();
    const quoteFile = formData.get('quoteFile') as File | null;

    if (!quoteFile) {
      return NextResponse.json({ error: 'quoteFile is required' }, { status: 400 });
    }

    // Save file to public/uploads (in a real app, use cloud storage)
    const bytes = await quoteFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `quotes/${bidId}_${Date.now()}.pdf`;
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotes');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, `${bidId}_${Date.now()}.pdf`), buffer);

    const bid = await db.bid.update({
      where: { id: bidId },
      data: {
        quoteFile: `/uploads/${fileName}`,
        quoteUploadedAt: new Date(),
        rfqStatus: 'received',
      },
    });

    return NextResponse.json(bid);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload quote';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
