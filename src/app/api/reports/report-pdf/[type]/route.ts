import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateFinancialReportPDF,
  generateProjectReportPDF,
  generateTaskReportPDF,
  generateClientReportPDF,
  generateInvoiceReportPDF,
} from '@/lib/pdf/pdf-generator';
import type {
  FinancialReportData,
  ProjectReportData,
  TaskReportData,
  ClientReportData,
  InvoiceReportData,
} from '@/lib/pdf/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') as 'ar' | 'en') || 'ar';

    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'financial':
        ({ pdfBuffer, filename } = await generateFinancialReport(lang));
        break;
      case 'projects':
        ({ pdfBuffer, filename } = await generateProjectReport(lang));
        break;
      case 'tasks':
        ({ pdfBuffer, filename } = await generateTaskReport(lang));
        break;
      case 'clients':
        ({ pdfBuffer, filename } = await generateClientReport(lang));
        break;
      case 'invoices':
        ({ pdfBuffer, filename } = await generateInvoiceReport(lang));
        break;
      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}. Valid types: financial, projects, tasks, clients, invoices` },
          { status: 400 }
        );
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error generating report PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report PDF' },
      { status: 500 }
    );
  }
}

async function generateFinancialReport(lang: 'ar' | 'en') {
  const invoiceStats = await db.invoice.aggregate({
    _sum: { total: true, paidAmount: true },
  });

  const pendingSum = await db.invoice.aggregate({
    _sum: { remaining: true },
    where: { status: { in: ['sent', 'partially_paid'] } },
  });

  const overdueSum = await db.invoice.aggregate({
    _sum: { remaining: true },
    where: { status: 'overdue' },
  });

  // Monthly data
  const now = new Date();
  const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rows: FinancialReportData['rows'] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const invoiced = await db.invoice.aggregate({
      _sum: { total: true },
      where: { status: { not: 'cancelled' }, createdAt: { gte: monthStart, lte: monthEnd } },
    });

    const paid = await db.invoice.aggregate({
      _sum: { paidAmount: true },
      where: { status: { in: ['paid', 'partially_paid'] }, createdAt: { gte: monthStart, lte: monthEnd } },
    });

    const pending = await db.invoice.aggregate({
      _sum: { remaining: true },
      where: { status: { in: ['sent', 'partially_paid'] } },
    });

    rows.push({
      date: lang === 'ar' ? arMonths[monthStart.getMonth()] : enMonths[monthStart.getMonth()],
      invoiced: invoiced._sum.total || 0,
      paid: paid._sum.paidAmount || 0,
      pending: pending._sum.remaining || 0,
    });
  }

  const data: FinancialReportData = {
    title: lang === 'ar' ? 'التقرير المالي' : 'Financial Report',
    dateRange: new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US'),
    summary: {
      totalInvoiced: invoiceStats._sum.total || 0,
      totalPaid: invoiceStats._sum.paidAmount || 0,
      totalPending: pendingSum._sum.remaining || 0,
      totalOverdue: overdueSum._sum.remaining || 0,
    },
    rows,
    currency: 'AED',
    language: lang,
  };

  return {
    pdfBuffer: await generateFinancialReportPDF(data),
    filename: `financial-report-${Date.now()}.pdf`,
  };
}

async function generateProjectReport(lang: 'ar' | 'en') {
  const projects = await db.project.findMany({
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    pending: projects.filter(p => p.status === 'on_hold').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
  };

  const data: ProjectReportData = {
    title: lang === 'ar' ? 'تقرير المشاريع' : 'Project Report',
    dateRange: new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US'),
    summary: stats,
    projects: projects.map(p => ({
      name: lang === 'ar' ? p.name : (p.nameEn || p.name),
      client: p.client.name,
      status: p.status,
      progress: p.progress,
      budget: p.budget,
    })),
    language: lang,
  };

  return {
    pdfBuffer: await generateProjectReportPDF(data),
    filename: `project-report-${Date.now()}.pdf`,
  };
}

async function generateTaskReport(lang: 'ar' | 'en') {
  const tasks = await db.task.findMany({
    include: {
      assignee: { select: { name: true } },
      project: { select: { name: true, nameEn: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done' && t.status !== 'cancelled').length,
  };

  const data: TaskReportData = {
    title: lang === 'ar' ? 'تقرير المهام' : 'Task Report',
    dateRange: new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US'),
    summary: stats,
    tasks: tasks.map(t => ({
      title: t.title,
      project: lang === 'ar' ? (t.project?.name || '-') : (t.project?.nameEn || t.project?.name || '-'),
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '-',
      assignee: t.assignee?.name,
    })),
    language: lang,
  };

  return {
    pdfBuffer: await generateTaskReportPDF(data),
    filename: `task-report-${Date.now()}.pdf`,
  };
}

async function generateClientReport(lang: 'ar' | 'en') {
  const clients = await db.client.findMany({
    include: {
      invoices: {
        select: { total: true, paidAmount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalRevenue = clients.reduce((sum, c) => sum + c.invoices.reduce((s, inv) => s + inv.total, 0), 0);

  const data: ClientReportData = {
    title: lang === 'ar' ? 'تقرير العملاء' : 'Client Report',
    dateRange: new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US'),
    summary: {
      total: clients.length,
      active: clients.filter(c => c.invoices.length > 0).length,
      totalRevenue,
    },
    clients: clients.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      totalInvoiced: c.invoices.reduce((s, inv) => s + inv.total, 0),
      totalPaid: c.invoices.reduce((s, inv) => s + inv.paidAmount, 0),
    })),
    currency: 'AED',
    language: lang,
  };

  return {
    pdfBuffer: await generateClientReportPDF(data),
    filename: `client-report-${Date.now()}.pdf`,
  };
}

async function generateInvoiceReport(lang: 'ar' | 'en') {
  const invoices = await db.invoice.findMany({
    include: {
      client: { select: { name: true } },
      project: { select: { name: true, nameEn: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    pending: invoices.filter(inv => ['sent', 'partially_paid'].includes(inv.status)).length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
  };

  const data: InvoiceReportData = {
    title: lang === 'ar' ? 'تقرير الفواتير' : 'Invoice Report',
    dateRange: new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US'),
    summary: stats,
    invoices: invoices.map(inv => ({
      invoiceNumber: inv.number,
      client: inv.client.name,
      project: lang === 'ar' ? inv.project?.name : (inv.project?.nameEn || inv.project?.name),
      total: inv.total,
      paidAmount: inv.paidAmount,
      status: inv.status,
      issueDate: new Date(inv.issueDate).toLocaleDateString('en-GB'),
      dueDate: new Date(inv.dueDate).toLocaleDateString('en-GB'),
    })),
    currency: 'AED',
    language: lang,
  };

  return {
    pdfBuffer: await generateInvoiceReportPDF(data),
    filename: `invoice-report-${Date.now()}.pdf`,
  };
}
