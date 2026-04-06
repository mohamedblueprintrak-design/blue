import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('statsOnly') === 'true';

    // ===== 1. Project Stats =====
    const [totalProjects, activeProjects, completedProjects, delayedProjects] =
      await Promise.all([
        db.project.count(),
        db.project.count({ where: { status: 'active' } }),
        db.project.count({ where: { status: 'completed' } }),
        db.project.count({ where: { status: 'delayed' } }),
      ]);

    // ===== Overdue tasks count (lightweight) =====
    const overdueTasksCount = await db.task.count({
      where: {
        status: { notIn: ['done', 'cancelled'] },
        dueDate: { not: null, lt: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    // If only stats are requested, return early
    if (statsOnly) {
      return NextResponse.json({
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          delayedProjects,
        },
        overdueTasksCount,
      });
    }

    // ===== 2. Invoice Stats =====
    const allOutstanding = await db.invoice.findMany({
      where: {
        status: { in: ['overdue', 'sent', 'partially_paid'] },
      },
      select: { total: true, remaining: true, status: true, dueDate: true, number: true, projectId: true, client: { select: { name: true, company: true } } },
    });

    const overdueInvoices = allOutstanding.filter(i => i.status === 'overdue');
    const outstandingTotal = allOutstanding.reduce((sum, i) => sum + i.remaining, 0);
    const outstandingCount = allOutstanding.length;
    const overdueCount = overdueInvoices.length;

    // ===== 3. Monthly Revenue (last 6 months) =====
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const paidInvoices = await db.invoice.findMany({
      where: {
        status: { in: ['paid', 'partially_paid'] },
        paidAmount: { gt: 0 },
        issueDate: { gte: sixMonthsAgo },
      },
      select: { paidAmount: true, issueDate: true },
    });

    // Group by month
    const revenueByMonth: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + inv.paidAmount;
    }

    // Build monthly revenue array for last 6 months
    const monthlyRevenue: Array<{ month: string; labelAr: string; labelEn: string; revenue: number }> = [];
    const now = new Date();
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthIdx = d.getMonth();
      monthlyRevenue.push({
        month: key,
        labelAr: monthNamesAr[monthIdx],
        labelEn: monthNamesEn[monthIdx],
        revenue: Math.round(revenueByMonth[key] || 0),
      });
    }

    // Calculate month-over-month change
    const thisMonth = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
    const revenueChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    // ===== 4. Recent Projects (last 5 updated) =====
    const recentProjects = await db.project.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        client: { select: { name: true, company: true } },
      },
    });

    // ===== 5. Upcoming Tasks (due within 7 days or overdue) =====
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingTasks = await db.task.findMany({
      where: {
        status: { notIn: ['done', 'cancelled'] },
        dueDate: { not: null, lte: sevenDaysFromNow },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        project: { select: { number: true, name: true } },
        assignee: { select: { name: true } },
      },
    });

    const overdueTasks = upcomingTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
    );

    // ===== 6. Department Progress (from ProjectStages) =====
    const allStages = await db.projectStage.findMany({
      where: {
        project: { status: 'active' },
      },
      select: {
        department: true,
        status: true,
      },
    });

    // Group departments: architectural, structural, MEP (all mep_* departments)
    const deptGroups: Record<string, { total: number; completed: number }> = {
      architectural: { total: 0, completed: 0 },
      structural: { total: 0, completed: 0 },
      mep: { total: 0, completed: 0 },
    };

    for (const stage of allStages) {
      let group = stage.department;
      if (stage.department.startsWith('mep_')) {
        group = 'mep';
      }
      if (deptGroups[group]) {
        deptGroups[group].total++;
        if (stage.status === 'APPROVED' || stage.status === 'COMPLETED') {
          deptGroups[group].completed++;
        }
      }
    }

    const departmentProgress = [
      {
        key: 'architectural',
        labelAr: 'القسم المعماري',
        labelEn: 'Architectural',
        ...deptGroups.architectural,
        progress: deptGroups.architectural.total > 0
          ? Math.round((deptGroups.architectural.completed / deptGroups.architectural.total) * 100)
          : 0,
        color: 'bg-teal-500',
      },
      {
        key: 'structural',
        labelAr: 'القسم الإنشائي',
        labelEn: 'Structural',
        ...deptGroups.structural,
        progress: deptGroups.structural.total > 0
          ? Math.round((deptGroups.structural.completed / deptGroups.structural.total) * 100)
          : 0,
        color: 'bg-blue-500',
      },
      {
        key: 'mep',
        labelAr: 'الأقسام الكهروميكانيكية',
        labelEn: 'MEP',
        ...deptGroups.mep,
        progress: deptGroups.mep.total > 0
          ? Math.round((deptGroups.mep.completed / deptGroups.mep.total) * 100)
          : 0,
        color: 'bg-amber-500',
      },
    ];

    // ===== 7. Alerts =====
    const alerts: Array<{
      id: string;
      type: 'overdue_invoice' | 'pending_approval' | 'overdue_task';
      titleAr: string;
      titleEn: string;
      descriptionAr: string;
      descriptionEn: string;
      timestamp: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    // Overdue invoice alerts
    for (const inv of overdueInvoices) {
      alerts.push({
        id: `inv-${inv.number}`,
        type: 'overdue_invoice',
        titleAr: `فاتورة متأخرة: ${inv.number}`,
        titleEn: `Overdue Invoice: ${inv.number}`,
        descriptionAr: `فاتورة بمبلغ ${inv.remaining.toLocaleString()} AED مستحقة للسداد - ${inv.client?.company || inv.client?.name || ''}`,
        descriptionEn: `Invoice of ${inv.remaining.toLocaleString()} AED is overdue - ${inv.client?.company || inv.client?.name || ''}`,
        timestamp: inv.dueDate?.toISOString() || new Date().toISOString(),
        severity: 'high',
      });
    }

    // Pending approval alerts (pending government approvals)
    const pendingGovApprovals = await db.govApproval.findMany({
      where: { status: { in: ['PENDING', 'SUBMITTED'] } },
      include: {
        project: { select: { number: true, name: true } },
      },
      take: 5,
    });

    for (const approval of pendingGovApprovals) {
      alerts.push({
        id: `gov-${approval.id}`,
        type: 'pending_approval',
        titleAr: `موافقة حكومية معلقة: ${approval.authority}`,
        titleEn: `Pending Gov. Approval: ${approval.authority}`,
        descriptionAr: `موافقة ${approval.authority} للمشروع ${approval.project.number} بحاجة متابعة`,
        descriptionEn: `${approval.authority} approval for project ${approval.project.number} needs follow-up`,
        timestamp: approval.submissionDate?.toISOString() || new Date().toISOString(),
        severity: 'medium',
      });
    }

    // Overdue task alerts
    for (const task of overdueTasks) {
      alerts.push({
        id: `task-${task.id}`,
        type: 'overdue_task',
        titleAr: `مهمة متأخرة: ${task.title}`,
        titleEn: `Overdue Task: ${task.title}`,
        descriptionAr: `المهمة تجاوزت الموعد النهائي - ${task.project?.name || ''}`,
        descriptionEn: `Task has exceeded its deadline - ${task.project?.name || ''}`,
        timestamp: task.dueDate?.toISOString() || new Date().toISOString(),
        severity: 'high',
      });
    }

    // Sort alerts by severity then timestamp
    alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        delayedProjects,
      },
      invoices: {
        outstandingTotal: Math.round(outstandingTotal),
        outstandingCount,
        overdueCount,
      },
      revenue: {
        monthly: monthlyRevenue,
        thisMonth: Math.round(thisMonth),
        lastMonth: Math.round(lastMonth),
        change: revenueChange,
      },
      recentProjects: recentProjects.map(p => ({
        id: p.id,
        number: p.number,
        name: p.name,
        nameEn: p.nameEn,
        clientName: p.client?.name || '',
        clientCompany: p.client?.company || '',
        status: p.status,
        progress: p.progress,
        updatedAt: p.updatedAt.toISOString(),
      })),
      upcomingTasks: upcomingTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() || null,
        isOverdue: t.dueDate ? new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false,
        projectName: t.project?.name || '',
        projectNumber: t.project?.number || '',
        assigneeName: t.assignee?.name || '',
      })),
      activeTasksCount: upcomingTasks.length,
      overdueTasksCount: overdueTasks.length,
      overdueTasksSidebarCount: overdueTasksCount,
      departmentProgress,
      alerts: alerts.slice(0, 10),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
