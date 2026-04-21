/**
 * Backup Restore API Route
 * POST /api/backup/restore - Restore from backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/lib/backup-service';

/**
 * POST - Restore from backup
 */
export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (!userId || userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'اسم ملف النسخة الاحتياطية مطلوب' },
        { status: 400 }
      );
    }

    // Security: Validate filename to prevent path traversal
    if (!filename.startsWith('blueprint_backup_') || !filename.endsWith('.db') || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { success: false, error: 'اسم ملف غير صالح' },
        { status: 400 }
      );
    }

    const result = await backupService.restoreBackup(filename);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'فشل في استعادة النسخة الاحتياطية' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'تم استعادة النسخة الاحتياطية بنجاح',
        filename,
        restoredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء استعادة النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
