import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

// In-memory conversation history
const conversationHistories = new Map<string, Array<{ role: 'user' | 'system' | 'assistant'; content: string }>>();

// Detect if user message is asking about specific topics
function detectTopics(message: string): string[] {
  const lower = message.toLowerCase();
  const topics: string[] = [];

  // Project-related
  if (/project|مشروع|مشاريع/.test(lower)) topics.push('projects');
  // Task-related
  if (/task|مهم|مهام|مهمة|overdue|متأخر|متأخرة/.test(lower)) topics.push('tasks');
  // Financial/invoice/budget
  if (/invoice|budget|financial|فاتور|ميزاني|إيراد|revenue|payment|دفع|مستحق/.test(lower)) topics.push('financial');
  // Client-related
  if (/client|عميل|عملاء/.test(lower)) topics.push('clients');
  // HR/employee
  if (/employee|hr|موظف|مندوب|حضور|attendance|leave|إجاز/.test(lower)) topics.push('hr');
  // Site management
  if (/site|visit|defect|موقع|زيار|عيب|defect/.test(lower)) topics.push('site');
  // Dashboard/summary/stats
  if (/dashboard|summary|stats|لوحة|ملخص|إحصائي|overview/.test(lower)) topics.push('dashboard');
  // Contract
  if (/contract|عقد|عقود/.test(lower)) topics.push('contracts');
  // Alert/notification
  if (/alert|notification|تنبيه|إشعار|warning|خطر/.test(lower)) topics.push('alerts');

  return topics;
}

// Fetch context data based on detected topics
async function fetchContextData(topics: string[], userId?: string) {
  const context: Record<string, unknown> = {};

  try {
    // Always fetch basic dashboard stats for context
    if (topics.includes('dashboard') || topics.length === 0) {
      const [totalProjects, activeProjects, completedProjects, delayedProjects, totalTasks, totalClients] =
        await Promise.all([
          db.project.count(),
          db.project.count({ where: { status: 'active' } }),
          db.project.count({ where: { status: 'completed' } }),
          db.project.count({ where: { status: 'delayed' } }),
          db.task.count(),
          db.client.count(),
        ]);
      context.dashboardStats = { totalProjects, activeProjects, completedProjects, delayedProjects, totalTasks, totalClients };
    }

    // Projects
    if (topics.includes('projects')) {
      const recentProjects = await db.project.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 8,
        include: {
          client: { select: { name: true, company: true } },
        },
      });
      context.projects = recentProjects.map(p => ({
        number: p.number,
        name: p.name,
        nameEn: p.nameEn,
        clientName: p.client?.name || p.client?.company || '',
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        location: p.location,
        type: p.type,
        startDate: p.startDate?.toISOString(),
        endDate: p.endDate?.toISOString(),
      }));

      // Delayed projects specifically
      const delayedProjects = recentProjects.filter(p => p.status === 'delayed');
      if (delayedProjects.length > 0) {
        context.delayedProjects = delayedProjects.map(p => ({
          number: p.number,
          name: p.name,
          progress: p.progress,
          endDate: p.endDate?.toISOString(),
          clientName: p.client?.name || p.client?.company || '',
        }));
      }
    }

    // Tasks
    if (topics.includes('tasks')) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const overdueTasks = await db.task.findMany({
        where: {
          status: { notIn: ['done', 'cancelled'] },
          dueDate: { not: null, lt: startOfDay },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
        include: {
          project: { select: { number: true, name: true } },
          assignee: { select: { name: true } },
        },
      });

      const userTasks = userId ? await db.task.findMany({
        where: {
          assigneeId: userId,
          status: { notIn: ['done', 'cancelled'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 8,
        include: {
          project: { select: { number: true, name: true } },
        },
      }) : [];

      context.tasks = {
        overdue: overdueTasks.map(t => ({
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate?.toISOString(),
          projectName: t.project?.name || '',
          assigneeName: t.assignee?.name || '',
          status: t.status,
        })),
        userTasks: userTasks.map(t => ({
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate?.toISOString(),
          status: t.status,
          projectName: t.project?.name || '',
          progress: t.progress,
        })),
        overdueCount: overdueTasks.length,
        userTasksCount: userTasks.length,
      };
    }

    // Financial
    if (topics.includes('financial')) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [invoices, payments] = await Promise.all([
        db.invoice.findMany({
          orderBy: { issueDate: 'desc' },
          take: 8,
          include: {
            client: { select: { name: true, company: true } },
          },
        }),
        db.payment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      const paidInvoices = await db.invoice.findMany({
        where: {
          status: { in: ['paid', 'partially_paid'] },
          paidAmount: { gt: 0 },
          issueDate: { gte: sixMonthsAgo },
        },
        select: { paidAmount: true, issueDate: true },
      });

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const overdueInvoices = invoices.filter(i => i.status === 'overdue');
      const outstandingTotal = invoices
        .filter(i => ['overdue', 'sent', 'partially_paid'].includes(i.status))
        .reduce((sum, i) => sum + i.remaining, 0);

      context.financial = {
        totalRevenue: Math.round(totalRevenue),
        overdueInvoices: overdueInvoices.map(i => ({
          number: i.number,
          total: i.total,
          remaining: i.remaining,
          dueDate: i.dueDate?.toISOString(),
          clientName: i.client?.name || i.client?.company || '',
        })),
        overdueCount: overdueInvoices.length,
        outstandingTotal: Math.round(outstandingTotal),
        recentPayments: payments.map(p => ({
          voucherNumber: p.voucherNumber,
          amount: p.amount,
          status: p.status,
          description: p.description,
        })),
      };
    }

    // Clients
    if (topics.includes('clients')) {
      const clients = await db.client.findMany({
        take: 10,
        include: {
          _count: { select: { projects: true, invoices: true, contracts: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      context.clients = clients.map(c => ({
        name: c.name,
        company: c.company,
        phone: c.phone,
        email: c.email,
        projectCount: c._count.projects,
        invoiceCount: c._count.invoices,
        contractCount: c._count.contracts,
        creditLimit: c.creditLimit,
      }));
    }

    // HR
    if (topics.includes('hr')) {
      const [employees, pendingLeaves] = await Promise.all([
        db.employee.findMany({
          take: 8,
          include: { user: { select: { name: true, email: true, isActive: true } } },
        }),
        db.leave.findMany({
          where: { status: 'pending' },
          take: 5,
          include: {
            employee: { select: { name: true } },
          },
        }),
      ]);

      context.hr = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.user.isActive).length,
        pendingLeaves: pendingLeaves.map(l => ({
          employeeName: l.employee.name,
          type: l.type,
          startDate: l.startDate.toISOString(),
          endDate: l.endDate.toISOString(),
          days: l.days,
          reason: l.reason,
        })),
        pendingLeaveCount: pendingLeaves.length,
        departments: [...new Set(employees.map(e => e.department).filter(Boolean))],
      };
    }

    // Site management
    if (topics.includes('site')) {
      const [siteVisits, openDefects] = await Promise.all([
        db.siteVisit.findMany({
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            project: { select: { number: true, name: true } },
          },
        }),
        db.defect.findMany({
          where: { status: { in: ['open', 'in_progress'] } },
          take: 8,
          include: {
            project: { select: { number: true, name: true } },
          },
        }),
      ]);

      context.site = {
        recentVisits: siteVisits.map(v => ({
          date: v.date.toISOString(),
          municipality: v.municipality,
          plotNumber: v.plotNumber,
          projectName: v.project.name,
          status: v.status,
        })),
        openDefects: openDefects.map(d => ({
          title: d.title,
          severity: d.severity,
          status: d.status,
          projectName: d.project.name,
          location: d.location,
        })),
        openDefectCount: openDefects.length,
        criticalDefectCount: openDefects.filter(d => d.severity === 'critical').length,
      };
    }

    // Contracts
    if (topics.includes('contracts')) {
      const contracts = await db.contract.findMany({
        take: 8,
        include: {
          client: { select: { name: true, company: true } },
          project: { select: { number: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      context.contracts = contracts.map(c => ({
        number: c.number,
        title: c.title,
        clientName: c.client?.name || c.client?.company || '',
        projectName: c.project.name,
        value: c.value,
        status: c.status,
        type: c.type,
        startDate: c.startDate?.toISOString(),
        endDate: c.endDate?.toISOString(),
      }));
    }

    // Alerts
    if (topics.includes('alerts')) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const [overdueInvoices, overdueTasks, pendingGovApprovals] = await Promise.all([
        db.invoice.findMany({
          where: { status: 'overdue' },
          take: 5,
          include: { client: { select: { name: true, company: true } } },
        }),
        db.task.findMany({
          where: {
            status: { notIn: ['done', 'cancelled'] },
            dueDate: { lt: startOfDay },
          },
          take: 5,
          include: {
            project: { select: { name: true } },
            assignee: { select: { name: true } },
          },
        }),
        db.govApproval.findMany({
          where: { status: { in: ['PENDING', 'SUBMITTED'] } },
          take: 5,
          include: { project: { select: { number: true, name: true } } },
        }),
      ]);

      context.alerts = {
        overdueInvoices: overdueInvoices.map(i => ({
          number: i.number,
          remaining: i.remaining,
          dueDate: i.dueDate?.toISOString(),
          clientName: i.client?.name || i.client?.company || '',
        })),
        overdueTasks: overdueTasks.map(t => ({
          title: t.title,
          dueDate: t.dueDate?.toISOString(),
          projectName: t.project?.name || '',
          assigneeName: t.assignee?.name || '',
        })),
        pendingGovApprovals: pendingGovApprovals.map(g => ({
          authority: g.authority,
          projectName: g.project.name,
          projectNumber: g.project.number,
          status: g.status,
        })),
        summary: {
          overdueInvoiceCount: overdueInvoices.length,
          overdueTaskCount: overdueTasks.length,
          pendingGovApprovalCount: pendingGovApprovals.length,
          totalAlerts: overdueInvoices.length + overdueTasks.length + pendingGovApprovals.length,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching context data:', error);
    // Continue without context data if there's an error
  }

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId = 'default', userId, language } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create conversation history
    if (!conversationHistories.has(conversationId)) {
      conversationHistories.set(conversationId, []);
    }
    const history = conversationHistories.get(conversationId)!;

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Keep only last 20 messages for context
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Fetch user info if userId is provided
    let userInfo: string | null = null;
    if (userId) {
      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { name: true, role: true, department: true, position: true, email: true },
        });
        if (user) {
          const roleNames: Record<string, { ar: string; en: string }> = {
            admin: { ar: 'المدير العام', en: 'Admin' },
            manager: { ar: 'المدير', en: 'Manager' },
            project_manager: { ar: 'مدير مشاريع', en: 'Project Manager' },
            engineer: { ar: 'مهندس', en: 'Engineer' },
            draftsman: { ar: 'رسام', en: 'Draftsman' },
            accountant: { ar: 'محاسب', en: 'Accountant' },
            hr: { ar: 'موارد بشرية', en: 'HR' },
            secretary: { ar: 'سكرتير', en: 'Secretary' },
            viewer: { ar: 'مشاهد', en: 'Viewer' },
          };
          const roleInfo = roleNames[user.role] || { ar: user.role, en: user.role };
          userInfo = `Current user: ${user.name} (${user.email}), Role: ${roleInfo.ar} / ${roleInfo.en}, Department: ${user.department || 'N/A'}, Position: ${user.position || 'N/A'}`;
        }
      } catch {
        // Continue without user info
      }
    }

    // Detect topics and fetch context data
    const topics = detectTopics(message);
    const contextData = await fetchContextData(topics, userId);

    // Build system prompt with context
    let contextSection = '';
    if (Object.keys(contextData).length > 0) {
      contextSection = `\n\nCurrent system data context (use this to provide accurate answers):\n${JSON.stringify(contextData, null, 2)}`;
    }

    const systemPrompt = `You are "BluePrint AI" (مساعد بلوبرنت الذكي), an intelligent assistant for engineering consultancy offices in the UAE.
You help with:
- Project management advice and best practices
- Budget calculations and cost estimates
- Document preparation guidance (reports, proposals, submittals)
- Schedule optimization and timeline planning
- Risk assessment and mitigation strategies
- UAE construction regulations (DEWA, DM/بلدية دبي, ADDC/هيئة أبوظبي, Civil Defense/الدفاع المدني, FEWA, Etisalat, etc.)
- Site visit procedures and reporting
- Contract management and amendment guidance
- Team workload and resource allocation

Key information about BluePrint system:
- Engineering consultancy management platform in the UAE
- Handles projects (villas, buildings, commercial, industrial)
- Tracks tasks with Kanban boards (todo, in_progress, review, done)
- Financial operations in AED (invoices, payments, proposals, budgets)
- Site management (visits, defects, site diary, RFI, submittals)
- Government approvals (Municipality, FEWA, Etisalat, Civil Defense)
- HR modules (employees, attendance, leave)
- Currency is AED (درهم إماراتي)

${userInfo ? `Current user: ${userInfo}\n` : ''}Guidelines:
- ALWAYS respond in the same language as the user's message (Arabic or English)
- Be concise, professional, and helpful
- When system data is provided in the context, USE IT to give accurate answers with real numbers and names
- Format data in a structured way using bullet points, numbered lists, or tables when appropriate
- When discussing projects, mention their status, progress percentage, and client
- For financial data, always show amounts in AED
- If no relevant data is found, say so honestly and suggest alternatives
- Provide actionable insights and recommendations when relevant
- Keep responses focused on the engineering consultancy domain${contextSection}`;

    let zai;
    try {
      zai = await ZAI.create();
    } catch {
      return NextResponse.json({
        error: 'AI_SERVICE_UNAVAILABLE',
        message: language === 'ar'
          ? 'عذراً، خدمة المساعد الذكي غير متاحة حالياً. يرجى المحاولة لاحقاً.'
          : 'Sorry, the AI assistant service is currently unavailable. Please try again later.',
      }, { status: 503 });
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...history.slice(0, -1), // All history except the current user message (already in history)
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiMessage = completion.choices[0]?.message?.content || '';

    // Add AI response to history
    history.push({ role: 'assistant', content: aiMessage });

    // Cleanup old conversations (keep last 100)
    if (conversationHistories.size > 100) {
      const keys = Array.from(conversationHistories.keys());
      for (let i = 0; i < keys.length - 50; i++) {
        conversationHistories.delete(keys[i]);
      }
    }

    return NextResponse.json({
      message: aiMessage,
      conversationId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Chat API error:', errorMessage);

    // Return user-friendly error messages
    if (errorMessage.includes('API key') || errorMessage.includes('auth') || errorMessage.includes('credential')) {
      return NextResponse.json({
        error: 'AI_AUTH_ERROR',
        message: 'عذراً، حدث خطأ في المصادقة مع خدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
      }, { status: 503 });
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return NextResponse.json({
        error: 'AI_TIMEOUT',
        message: 'عذراً، استغرقت المعالجة وقتاً طويلاً. يرجى المحاولة مرة أخرى.',
      }, { status: 504 });
    }

    return NextResponse.json({
      error: errorMessage,
      message: 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    }, { status: 500 });
  }
}
