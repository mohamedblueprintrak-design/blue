import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Mock automations data (fallback when DB has no automation table)
const mockAutomations = [
  {
    id: 'auto-1',
    name: 'تنبيه تجاوز الميزانية',
    description: 'إرسال تنبيه عند تجاوز ميزانية المشروع 80%',
    triggerType: 'threshold',
    triggerConfig: { threshold: 80, metric: 'budget' },
    actionType: 'notification',
    actionConfig: { recipients: ['manager', 'admin'], template: 'budget_alert' },
    status: 'active',
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    runCount: 12,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'auto-2',
    name: 'تذكير المهام المتأخرة',
    description: 'إرسال تذكير يومي للمهام التي تجاوزت موعد التسليم',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 9 * * *', timezone: 'Asia/Dubai' },
    actionType: 'notification',
    actionConfig: { template: 'task_reminder', includeOverdue: true },
    status: 'active',
    lastRunAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    runCount: 45,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'auto-3',
    name: 'إتمام المشروع تلقائياً',
    description: 'عند وصول نسبة الإنجاز 100% → تحديث حالة المشروع إلى مكتمل',
    triggerType: 'event',
    triggerConfig: { event: 'project_progress_100' },
    actionType: 'task',
    actionConfig: { action: 'mark_project_completed' },
    status: 'active',
    lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    runCount: 3,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'auto-4',
    name: 'تذكير الفواتير المستحقة',
    description: 'إرسال تذكير عند اقتراب موعد استحقاق الفاتورة',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 8 * * *', timezone: 'Asia/Dubai' },
    actionType: 'email',
    actionConfig: { template: 'invoice_reminder' },
    status: 'inactive',
    lastRunAt: null,
    runCount: 0,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'auto-5',
    name: 'إنشاء إشعار عند تأخر المهمة',
    description: 'عند تجاوز المهمة لموعد التسليم → إنشاء إشعار',
    triggerType: 'event',
    triggerConfig: { event: 'task_overdue' },
    actionType: 'notification',
    actionConfig: { recipients: ['assignee', 'manager'], template: 'overdue_alert' },
    status: 'active',
    lastRunAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    runCount: 28,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory store for automations (since we use client-side rules pattern)
let automationsStore = [...mockAutomations];

// GET - Fetch all automations
export async function GET() {
  try {
    // Try database first
    try {
      const dbAutomations = await (db as any).automation?.findMany?.({
        orderBy: { createdAt: 'desc' },
      });
      if (dbAutomations && dbAutomations.length > 0) {
        return successResponse(dbAutomations);
      }
    } catch {
      // No automation table - use in-memory store
    }

    return successResponse(automationsStore);
  } catch (error) {
    console.error('Error fetching automations:', error);
    return errorResponse('Failed to fetch automations', 500);
  }
}

// POST - Create new automation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actionType, actionConfig } = body;

    if (!name || !triggerType || !actionType) {
      return errorResponse('الاسم ونوع المشغل ونوع الإجراء مطلوبون');
    }

    const newAutomation = {
      id: `auto-${Date.now()}`,
      name,
      description: description || null,
      triggerType,
      triggerConfig: triggerConfig || {},
      actionType,
      actionConfig: actionConfig || {},
      status: 'inactive',
      lastRunAt: null,
      runCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Try database first
    try {
      const created = await (db as any).automation?.create?.({
        data: newAutomation,
      });
      if (created) return successResponse(created);
    } catch {
      // No automation table - use in-memory store
    }

    automationsStore.unshift(newAutomation);
    return successResponse(newAutomation);
  } catch (error) {
    console.error('Error creating automation:', error);
    return errorResponse('Failed to create automation', 500);
  }
}
