import { NextRequest, NextResponse } from 'next/server';
import { generateExcelExport } from '@/lib/excel-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'projects';
    const lang = (searchParams.get('lang') as 'ar' | 'en') || 'ar';

    const validTypes = ['financial', 'projects', 'tasks', 'invoices', 'clients', 'contracts'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const buffer = await generateExcelExport(type, lang);

    const filename = `blueprint-${type}-export-${Date.now()}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Excel export' },
      { status: 500 }
    );
  }
}
