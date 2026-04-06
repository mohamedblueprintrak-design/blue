import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    let settings = await db.companySettings.findFirst();
    if (!settings) {
      settings = await db.companySettings.create({
        data: {
          name: 'مكتب الاستشارات الهندسية',
          nameEn: 'Engineering Consultancy Office',
          currency: 'AED',
          timezone: 'Asia/Dubai',
          workingDays: 'sat,sun,mon,tue,wed,thu',
          workingHours: '08:00-17:00',
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existing = await db.companySettings.findFirst();

    if (!existing) {
      const settings = await db.companySettings.create({ data: body });
      return NextResponse.json(settings);
    }

    const settings = await db.companySettings.update({
      where: { id: existing.id },
      data: body,
    });

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
