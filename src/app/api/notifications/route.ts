import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const projectId = searchParams.get('projectId');

    const where: Record<string, unknown> = {};

    if (filter === 'unread') {
      where.isRead = false;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { isRead: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      const notification = await db.notification.findUnique({ where: { id } });
      if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      await db.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'id or markAllRead is required' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
