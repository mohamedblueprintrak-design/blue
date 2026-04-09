import { NextRequest, NextResponse } from 'next/server';
import { generateSiteReportPDFBuffer } from '@/lib/pdf/site-report-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') as 'ar' | 'en') || 'en';

    const pdfBuffer = await generateSiteReportPDFBuffer(id, lang);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="site-diary-${id}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error generating site report PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate site report PDF' },
      { status: 500 }
    );
  }
}
