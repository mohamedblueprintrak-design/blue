import { NextRequest, NextResponse } from 'next/server';
import { generateProposalPDFBuffer } from '@/lib/pdf/proposal-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') as 'ar' | 'en') || 'ar';

    const pdfBuffer = await generateProposalPDFBuffer(id, lang);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="proposal-${id}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error generating proposal PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate proposal PDF' },
      { status: 500 }
    );
  }
}
