/**
 * Backup API Routes
 * GET /api/backup - List all backups
 * POST /api/backup - Create new backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/lib/backup-service';

function requireAdmin(request: NextRequest): NextResponse | null {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  if (!userId || userRole !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}

/**
 * GET - List all backups with stats
 */
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const backups = await backupService.listBackups();
    const stats = await backupService.getStats();

    return NextResponse.json({
      success: true,
      data: { backups, stats },
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب قائمة النسخ الاحتياطي' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new backup
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const result = await backupService.createBackup();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'فشل في إنشاء النسخة الاحتياطية' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'تم إنشاء النسخة الاحتياطية بنجاح',
        backup: result,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
