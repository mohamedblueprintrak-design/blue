import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateBody, aiChatSchema } from '@/lib/api-validation';
import { providerRegistry } from '@/lib/ai/providers/registry';
import type { ChatMessage } from '@/lib/ai/providers/types';

// ============================================
// ZAI SDK — Lazy-load + Direct HTTP fallback
// ============================================
// The ZAI SDK reads from .z-ai-config file, but on local dev machines
// that file may not exist. So we use a two-tier approach:
//   1. Try the ZAI SDK (requires .z-ai-config)
//   2. Fall back to direct HTTP call using env vars (ZAI_BASE_URL, etc.)
// This way it works BOTH on the hosted server AND on local machines.

let ZAISdk: typeof import('z-ai-web-dev-sdk').default | null = null;
async function getZAI() {
  if (!ZAISdk) {
    try {
      const mod = await import('z-ai-web-dev-sdk');
      ZAISdk = mod.default;
    } catch (importError) {
      console.warn('[AI] Failed to import z-ai-web-dev-sdk:', importError instanceof Error ? importError.message : importError);
      return null;
    }
  }
  return ZAISdk;
}

/**
 * Call ZAI backend directly via HTTP — no .z-ai-config needed.
 * Reads config from environment variables:
 *   ZAI_BASE_URL  (default: http://172.25.136.193:8080/v1)
 *   ZAI_API_KEY   (default: Z.ai)
 *   ZAI_CHAT_ID   (optional)
 *   ZAI_USER_ID   (optional)
 *   ZAI_TOKEN     (optional)
 */
async function callZaiDirect(
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const baseUrl = process.env.ZAI_BASE_URL || 'http://172.25.136.193:8080/v1';
  const apiKey = process.env.ZAI_API_KEY || 'Z.ai';
  const chatId = process.env.ZAI_CHAT_ID || '';
  const userId = process.env.ZAI_USER_ID || '';
  const token = process.env.ZAI_TOKEN || '';

  const url = `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Z-AI-From': 'Z',
  };
  if (chatId) headers['X-Chat-Id'] = chatId;
  if (userId) headers['X-User-Id'] = userId;
  if (token) headers['X-Token'] = token;

  const body = {
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1500,
    thinking: { type: 'disabled' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZAI direct call failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Note: We now use database persistence instead of in-memory storage
// The conversation history is now saved in AIChatConversation and AIChatMessage tables

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
  if (/site|visit|defect|موقع|زيار|عيب/.test(lower)) topics.push('site');
  // Dashboard/summary/stats
  if (/dashboard|summary|stats|لوحة|ملخص|إحصائي|overview/.test(lower)) topics.push('dashboard');
  // Contract
  if (/contract|عقد|عقود/.test(lower)) topics.push('contracts');
  // Alert/notification
  if (/alert|notification|تنبيه|إشعار|warning|خطر/.test(lower)) topics.push('alerts');
  // Contractors / bids / tenders / evaluation
  if (/contractor|مقاول|عطاء|مناقص|تقييم مقاول|bid|tender|عرض سعر/.test(lower)) topics.push('contractors');
  // Team / members / assignments
  if (/team|فريق|أعضاء|assignment|توزيع|کار|staff/.test(lower)) topics.push('team');
  // Reports / statistics
  if (/report|تقرير|تقارير|إحصائ/.test(lower)) topics.push('reports');

  return topics;
}

// Fetch context data based on detected topics
async function fetchContextData(topics: string[], userId?: string, projectId?: string) {
  const context: Record<string, unknown> = {};

  // Build project-specific where clause
  const projectWhere: Record<string, unknown> = projectId ? { projectId } : {};

  try {
    // Always fetch basic dashboard stats for context
    if (topics.includes('dashboard') || topics.length === 0) {
      const [totalProjects, activeProjects, completedProjects, delayedProjects, totalTasks, totalClients] =
        await Promise.all([
          projectId ? db.project.count({ where: { id: projectId } }) : db.project.count(),
          projectId ? db.project.count({ where: { id: projectId, status: 'active' } }) : db.project.count({ where: { status: 'active' } }),
          projectId ? db.project.count({ where: { id: projectId, status: 'completed' } }) : db.project.count({ where: { status: 'completed' } }),
          projectId ? db.project.count({ where: { id: projectId, status: 'delayed' } }) : db.project.count({ where: { status: 'delayed' } }),
          db.task.count({ where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined }),
          db.client.count(),
        ]);
      context.dashboardStats = { totalProjects, activeProjects, completedProjects, delayedProjects, totalTasks, totalClients };
    }

    // Projects
    if (topics.includes('projects')) {
      const recentProjects = await db.project.findMany({
        where: projectId ? { id: projectId } : undefined,
        orderBy: { updatedAt: 'desc' },
        take: projectId ? 1 : 8,
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
          ...projectWhere,
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
          ...projectWhere,
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
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          orderBy: { issueDate: 'desc' },
          take: 8,
          include: {
            client: { select: { name: true, company: true } },
          },
        }),
        db.payment.findMany({
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      const paidInvoices = await db.invoice.findMany({
        where: {
          ...(Object.keys(projectWhere).length > 0 ? projectWhere : {}),
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
        activeEmployees: employees.filter(e => e.user?.isActive).length,
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
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            project: { select: { number: true, name: true } },
          },
        }),
        db.defect.findMany({
          where: {
            ...(Object.keys(projectWhere).length > 0 ? projectWhere : {}),
            status: { in: ['open', 'in_progress'] },
          },
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
          projectName: v.project?.name || '',
          status: v.status,
        })),
        openDefects: openDefects.map(d => ({
          title: d.title,
          severity: d.severity,
          status: d.status,
          projectName: d.project?.name || '',
          location: d.location,
        })),
        openDefectCount: openDefects.length,
        criticalDefectCount: openDefects.filter(d => d.severity === 'critical').length,
      };
    }

    // Contracts
    if (topics.includes('contracts')) {
      const contracts = await db.contract.findMany({
        where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
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
        projectName: c.project?.name || '',
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
          where: {
            ...(Object.keys(projectWhere).length > 0 ? projectWhere : {}),
            status: 'overdue',
          },
          take: 5,
          include: { client: { select: { name: true, company: true } } },
        }),
        db.task.findMany({
          where: {
            ...projectWhere,
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
          where: {
            ...(Object.keys(projectWhere).length > 0 ? projectWhere : {}),
            status: { in: ['PENDING', 'SUBMITTED'] },
          },
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
          projectName: g.project?.name || '',
          projectNumber: g.project?.number || '',
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

    // Contractors / Bids / Tenders
    if (topics.includes('contractors')) {
      const [contractors, bids] = await Promise.all([
        db.contractor.findMany({
          take: 10,
          orderBy: { rating: 'desc' },
        }),
        db.bid.findMany({
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            contractor: { select: { id: true, name: true, companyName: true, rating: true, category: true } },
            project: { select: { number: true, name: true } },
            evaluations: {
              select: { criteria: true, score: true, maxScore: true, weight: true, notes: true },
            },
          },
        }),
      ]);

      // Compute average evaluation scores for each bid
      const bidsWithEval = bids.map(b => {
        const evals = b.evaluations;
        const totalWeight = evals.reduce((sum, e) => sum + e.weight, 0);
        const weightedScore = evals.reduce((sum, e) => sum + (e.score / e.maxScore) * e.weight, 0);
        const avgScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : null;
        return {
          id: b.id,
          contractorName: b.contractorName || b.contractor?.name || '',
          contractorCompany: b.contractor?.companyName || '',
          contractorRating: b.contractor?.rating || 0,
          contractorCategory: b.contractor?.category || '',
          projectName: b.project?.name || '',
          projectNumber: b.project?.number || '',
          amount: b.amount,
          technicalScore: b.technicalScore,
          financialScore: b.financialScore,
          totalScore: b.totalScore,
          evaluationAverageScore: avgScore,
          status: b.status,
          deadline: b.deadline?.toISOString(),
          evaluationCriteria: evals.map(e => ({
            criteria: e.criteria,
            score: e.score,
            maxScore: e.maxScore,
            weight: e.weight,
          })),
          notes: b.evaluationNotes,
        };
      });

      context.contractors = {
        list: contractors.map(c => ({
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          companyName: c.companyName,
          companyEn: c.companyEn,
          contactPerson: c.contactPerson,
          phone: c.phone,
          email: c.email,
          category: c.category,
          rating: c.rating,
          specialties: c.specialties,
          crNumber: c.crNumber,
          licenseNumber: c.licenseNumber,
          licenseExpiry: c.licenseExpiry?.toISOString(),
        })),
        totalContractors: contractors.length,
      };

      context.bids = {
        list: bidsWithEval,
        totalCount: bids.length,
        submitted: bids.filter(b => b.status === 'submitted').length,
        underReview: bids.filter(b => b.status === 'under_review').length,
        accepted: bids.filter(b => b.status === 'accepted').length,
        rejected: bids.filter(b => b.status === 'rejected').length,
      };
    }

    // Team / Project Members
    if (topics.includes('team')) {
      // Get project assignments if projectId is provided, otherwise get recent team activity
      if (projectId) {
        const assignments = await db.projectAssignment.findMany({
          where: { projectId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                position: true,
                isActive: true,
              },
            },
          },
        });

        // Get task counts per team member for this project
        const teamTaskStats = await Promise.all(
          assignments.map(async (a) => {
            const taskCounts = await db.task.groupBy({
              by: ['status'],
              where: { projectId, assigneeId: a.userId },
              _count: true,
            });
            const counts: Record<string, number> = {};
            taskCounts.forEach(tc => { counts[tc.status] = tc._count; });
            return {
              userId: a.userId,
              userName: a.user.name,
              userRole: a.role,
              department: a.user.department,
              position: a.user.position,
              isActive: a.user.isActive,
              taskCounts: counts,
            };
          })
        );

        context.team = {
          projectId,
          members: assignments.map(a => ({
            userId: a.user.id,
            name: a.user.name,
            email: a.user.email,
            department: a.user.department,
            position: a.user.position,
            role: a.role,
            isActive: a.user.isActive,
          })),
          memberCount: assignments.length,
          taskStats: teamTaskStats,
        };
      } else {
        // Show overall team distribution across projects
        const activeProjectsWithTeam = await db.project.findMany({
          where: { status: { in: ['active', 'delayed'] } },
          take: 5,
          include: {
            assignments: {
              include: {
                user: { select: { id: true, name: true, department: true, position: true } },
              },
            },
          },
        });

        context.team = {
          projectTeams: activeProjectsWithTeam.map(p => ({
            projectName: p.name,
            projectNumber: p.number,
            status: p.status,
            members: p.assignments.map(a => ({
              name: a.user.name,
              department: a.user.department,
              position: a.user.position,
              role: a.role,
            })),
          })),
        };
      }
    }

    // Reports / Statistics summary
    if (topics.includes('reports')) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        projectCount,
        activeProjects,
        completedThisMonth,
        taskStats,
        financialSummary,
        siteVisitCount,
        openDefectCount,
        contractorCount,
        pendingBidsCount,
        teamMemberCount,
      ] = await Promise.all([
        db.project.count(Object.keys(projectWhere).length > 0 ? { where: projectWhere } : undefined),
        db.project.count({ where: { ...Object.keys(projectWhere).length > 0 ? projectWhere : {}, status: 'active' } }),
        db.project.count({
          where: { ...Object.keys(projectWhere).length > 0 ? projectWhere : {}, status: 'completed', updatedAt: { gte: startOfMonth } },
        }),
        db.task.groupBy({
          by: ['status'],
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          _count: true,
        }),
        db.invoice.aggregate({
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          _sum: { total: true, paidAmount: true, remaining: true },
          _count: true,
        }),
        db.siteVisit.count({
          where: Object.keys(projectWhere).length > 0 ? { ...projectWhere, date: { gte: startOfMonth } } : { date: { gte: startOfMonth } },
        }),
        db.defect.count({
          where: { ...Object.keys(projectWhere).length > 0 ? projectWhere : {}, status: { in: ['open', 'in_progress'] } },
        }),
        db.contractor.count(),
        db.bid.count({
          where: { ...Object.keys(projectWhere).length > 0 ? projectWhere : {}, status: { in: ['submitted', 'under_review'] } },
        }),
        db.projectAssignment.groupBy({
          by: ['projectId'],
          _count: true,
        }),
      ]);

      const taskBreakdown: Record<string, number> = {};
      taskStats.forEach(ts => { taskBreakdown[ts.status] = ts._count; });

      context.reports = {
        projectStats: {
          total: projectCount,
          active: activeProjects,
          completedThisMonth,
        },
        taskBreakdown,
        totalTasks: taskStats.reduce((sum, ts) => sum + ts._count, 0),
        financial: {
          totalInvoiced: financialSummary._sum.total || 0,
          totalCollected: financialSummary._sum.paidAmount || 0,
          totalOutstanding: financialSummary._sum.remaining || 0,
          invoiceCount: financialSummary._count,
        },
        siteStats: {
          visitsThisMonth: siteVisitCount,
          openDefects: openDefectCount,
        },
        contractorStats: {
          totalContractors: contractorCount,
          pendingBids: pendingBidsCount,
        },
        teamStats: {
          totalAssignments: teamMemberCount.reduce((sum, tm) => sum + tm._count, 0),
          projectsWithTeam: teamMemberCount.length,
        },
        period: 'current',
      };
    }
  } catch (error) {
    console.error('Error fetching context data:', error);
    // Continue without context data if there's an error
  }

  return context;
}

// Fetch project context for system prompt when projectId is provided
async function fetchProjectContext(projectId: string): Promise<string | null> {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { name: true, company: true } },
      },
    });

    if (!project) return null;

    const statusMap: Record<string, { ar: string; en: string }> = {
      active: { ar: 'نشط', en: 'Active' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      delayed: { ar: 'متأخر', en: 'Delayed' },
      on_hold: { ar: 'معلق', en: 'On Hold' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    const statusInfo = statusMap[project.status] || { ar: project.status, en: project.status };
    const clientName = project.client?.name || project.client?.company || 'N/A';

    return `Current project context:
- Project Number: ${project.number}
- Project Name: ${project.name} (${project.nameEn || ''})
- Status: ${statusInfo.en} / ${statusInfo.ar}
- Progress: ${project.progress}%
- Budget: ${project.budget.toLocaleString()} AED
- Client: ${clientName}
- Location: ${project.location || 'N/A'}
- Type: ${project.type || 'N/A'}
- Start Date: ${project.startDate?.toISOString().split('T')[0] || 'N/A'}
- End Date: ${project.endDate?.toISOString().split('T')[0] || 'N/A'}`;
  } catch {
    return null;
  }
}


// ============================================
// Demo Mode AI Responses (works without API keys)
// ============================================
function getDemoResponse(message: string, language: string, contextData: Record<string, unknown>): string {
  const isAr = language === 'ar';
  const lower = message.toLowerCase();

  if (/dashboard|overview|ملخص|لوحة|إحصائ/.test(lower)) {
    const s = contextData.dashboardStats as Record<string, number> | undefined;
    if (s) {
      return isAr
        ? `📊 **ملخص النظام:**\n\n• إجمالي المشاريع: ${s.totalProjects || 0}\n• النشطة: ${s.activeProjects || 0}\n• المكتملة: ${s.completedProjects || 0}\n• المتأخرة: ${s.delayedProjects || 0}\n• المهام: ${s.totalTasks || 0}\n• العملاء: ${s.totalClients || 0}\n\n💡 *اسألني عن أي مشروع أو مهمة*`
        : `📊 **System Overview:**\n\n• Total Projects: ${s.totalProjects || 0}\n• Active: ${s.activeProjects || 0}\n• Completed: ${s.completedProjects || 0}\n• Delayed: ${s.delayedProjects || 0}\n• Tasks: ${s.totalTasks || 0}\n• Clients: ${s.totalClients || 0}\n\n💡 *Ask about any project or task*`;
    }
  }

  if (/project|مشروع|مشاريع/.test(lower)) {
    return isAr
      ? '🏗️ **المشاريع:** يمكنني مساعدتك في تتبع المشاريع والمراحل. حدد مشروع معين للتفاصيل.'
      : '🏗️ **Projects:** I can help track projects and stages. Specify a project for details.';
  }
  if (/task|مهم|مهام/.test(lower)) {
    return isAr
      ? '📋 **المهام:** يمكنني مساعدتك في تتبع المهام المتأخرة وتوزيعها. حدد مشروع أو أولوية.'
      : '📋 **Tasks:** I can help track overdue tasks and assignments. Specify a project or priority.';
  }
  if (/invoice|budget|financial|فاتور|ميزاني/.test(lower)) {
    return isAr
      ? '💰 **المالية:** يمكنني مراجعة الفواتير والميزانيات. حدد مشروع أو فترة زمنية.'
      : '💰 **Financial:** I can review invoices and budgets. Specify a project or period.';
  }
  if (/client|عميل|عملاء/.test(lower)) {
    return isAr
      ? '👥 **العملاء:** يمكنني عرض بيانات العملاء ومشاريعهم. حدد عميل للتفاصيل.'
      : '👥 **Clients:** I can show client data and their projects. Specify a client for details.';
  }
  if (/hello|hi|مرحب|أهلا|السلام/.test(lower)) {
    return isAr
      ? '👋 **مرحباً!** أنا المساعد الذكي لبلوبرنت. اسألني عن: المشاريع، المهام، الفواتير، العملاء، الموظفين.'
      : '👋 **Hello!** I\'m the BluePrint AI Assistant. Ask me about: projects, tasks, invoices, clients, employees.';
  }
  if (/help|مساعد|ماذا تستطيع/.test(lower)) {
    return isAr
      ? '🤖 **ال أوامر المتاحة:**\n• "ملخص" — ملخص النظام\n• "مشاريع" — حالة المشاريع\n• "مهام" — تتبع المهام\n• "فواتير" — الفواتير\n• "عملاء" — بيانات العملاء\n\n💡 *أضف API Key في .env لإجابات أذكى*'
      : '🤖 **Available commands:**\n• "dashboard" — system overview\n• "projects" — project status\n• "tasks" — task tracking\n• "invoices" — financial data\n• "clients" — client info\n\n💡 *Add API Key in .env for smarter responses*';
  }

  return isAr
    ? '🤖 أنا في وضع العرض التجريبي. اكتب "مساعدة" لعرض الأوامر المتاحة.\n💡 *أضف API Key في .env لإجابات ذكية متقدمة*'
    : '🤖 I\'m in demo mode. Type "help" for available commands.\n💡 *Add API Key in .env for advanced AI responses*';
}

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, aiChatSchema);
    if (body instanceof NextResponse) return body;
    const { message, conversationId: rawConversationId, userId, language, projectId, modelId: bodyModelId, model: bodyModel } = body;

    // Fix: generate a unique conversationId if empty to prevent unique constraint crash
    const conversationId = rawConversationId || `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Fix: prefer modelId over model (frontend sends modelId, schema now accepts both)
    const resolvedModelId = (bodyModelId && bodyModelId !== 'gpt-4') ? bodyModelId : ((bodyModel && bodyModel !== 'gpt-4') ? bodyModel : 'zai-default');

    // Get or create conversation in database
    let conversation = await db.aIChatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await db.aIChatConversation.create({
        data: {
          id: conversationId,
          userId: userId || 'anonymous',
          projectId: projectId || null,
          title: message.substring(0, 50),
          messageCount: 0,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20,
          },
        },
      });
    }

    // Save user message
    await db.aIChatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: message,
      },
    });

    // Build history from database messages
    const history = conversation.messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

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
    const contextData = await fetchContextData(topics, userId, projectId);

    // Fetch project context if projectId is provided
    let projectContextSection = '';
    if (projectId) {
      const projectContext = await fetchProjectContext(projectId);
      if (projectContext) {
        projectContextSection = `\n\n${projectContext}\nThe user is currently viewing this specific project. Provide answers focused on this project's data. When answering, always reference this project context and use its specific data when available.`;
      }
    }

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
- Contractor evaluation and bid comparison analysis
- Project team assignments and workload balancing
- Comprehensive reporting and KPI tracking

Key information about BluePrint system:
- Engineering consultancy management platform in the UAE
- Handles projects (villas, buildings, commercial, industrial)
- Tracks tasks with Kanban boards (todo, in_progress, review, done)
- Financial operations in AED (invoices, payments, proposals, budgets)
- Site management (visits, defects, site diary, RFI, submittals)
- Government approvals (Municipality, FEWA, Etisalat, Civil Defense)
- HR modules (employees, attendance, leave)
- Contractor management with evaluation system (technical, financial scoring)
- Bid/tender management with weighted criteria evaluation
- Project team assignments and task distribution
- Currency is AED (درهم إماراتي)

${userInfo ? `Current user: ${userInfo}\n` : ''}${projectContextSection}

Guidelines:
- ALWAYS respond in the same language as the user's message (Arabic or English)
- Be concise, professional, and helpful
- When system data is provided in the context, USE IT to give accurate answers with real numbers and names
- Format data in a structured way using **bold text**, bullet points, numbered lists, tables (Markdown), and headings when appropriate
- Use Markdown formatting to make responses more readable: **bold** for emphasis, \`inline code\` for technical terms, and proper headings
- When discussing projects, mention their status, progress percentage, and client
- For financial data, always show amounts in AED with proper number formatting
- For contractor evaluation, present comparison tables with scores and recommendations
- For team topics, show workload distribution and suggest balancing if needed
- If no relevant data is found, say so honestly and suggest alternatives
- Provide actionable insights and recommendations when relevant
- Keep responses focused on the engineering consultancy domain${contextSection}`;

    // ============================================
    // Multi-Provider AI Call with ZAI fallback
    // ============================================
    const modelId = resolvedModelId;
    const { provider, model } = providerRegistry.parseModelId(modelId);

    let aiMessage = '';
    let usedProvider = provider;
    let usedModel = model;

    if (provider === 'zai') {
      // Try built-in ZAI SDK first, then direct HTTP call, then external providers
      let zaiAvailable = false;
      try {
        const ZAIClass = await getZAI();
        if (ZAIClass) {
          const zai = await ZAIClass.create();
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...history,
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          });
          aiMessage = completion.choices[0]?.message?.content || '';
          usedModel = 'zai-default';
          zaiAvailable = true;
        }
      } catch (zaiError) {
        console.warn('[AI] ZAI SDK failed, trying direct HTTP call:', zaiError instanceof Error ? zaiError.message : zaiError);
      }

      // Fallback tier 2: Direct HTTP call to ZAI backend (no .z-ai-config needed)
      if (!zaiAvailable) {
        try {
          const zaiMessages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
          ];
          aiMessage = await callZaiDirect(zaiMessages, { temperature: 0.7, maxTokens: 1500 });
          usedModel = 'zai-default';
          zaiAvailable = true;
        } catch (directError) {
          console.warn('[AI] ZAI direct HTTP call failed:', directError instanceof Error ? directError.message : directError);
        }
      }

      // Fallback: use first available external provider
      if (!zaiAvailable) {
        const fallbackProvider = providerRegistry.getFirstAvailableExternalProvider();
        if (fallbackProvider) {
          const extProvider = providerRegistry.getProvider(fallbackProvider.providerId);
          if (extProvider) {
            const chatMessages: ChatMessage[] = [
              { role: 'system', content: systemPrompt },
              ...history.slice(0, -1).map((m: { role: string; content: string }) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
              })),
              { role: 'user', content: message },
            ];
            aiMessage = await extProvider.chat(chatMessages, {
              model: fallbackProvider.model,
              temperature: 0.7,
              maxTokens: 1500,
            });
            usedProvider = fallbackProvider.providerId;
            usedModel = fallbackProvider.model;
          }
        }
      }

      if (!aiMessage) {
        // Demo mode fallback — provide useful responses without API keys
        const isDemo = process.env.DEMO_MODE !== 'false' && process.env.NODE_ENV !== 'production';
        if (isDemo) {
          aiMessage = getDemoResponse(message, language || 'ar', contextData);
          usedProvider = 'demo';
          usedModel = 'demo-fallback';
        } else {
          return NextResponse.json({
            error: 'AI_SERVICE_UNAVAILABLE',
            message: language === 'ar'
              ? 'عذراً، خدمة المساعد الذكي غير متاحة. يرجى إضافة API Key لأحد المزودين في ملف .env'
              : 'AI assistant unavailable. Please add an API key for one of the providers in your .env file',
          }, { status: 503 });
        }
      }
    } else {
      // Use external provider (OpenAI, Gemini, DeepSeek, etc.)
      const externalProvider = providerRegistry.getProvider(provider);
      if (!externalProvider) {
        return NextResponse.json({
          error: 'PROVIDER_NOT_CONFIGURED',
          message: language === 'ar'
            ? `المزود "${provider}" غير متوفر. يرجى إضافة API Key في ملف .env`
            : `Provider "${provider}" is not available. Please check API key in .env`,
        }, { status: 400 });
      }

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(0, -1).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      aiMessage = await externalProvider.chat(chatMessages, {
        model,
        temperature: 0.7,
        maxTokens: 1500,
      });
    }

    // Save AI response to database
    await db.aIChatMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiMessage,
        tokens: 0,
        model: usedModel,
      },
    });

    // Update conversation with new message count and last activity
    await db.aIChatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 2 }, // User message + AI response
        title: conversation.title || message.substring(0, 50),
      },
    });

    return NextResponse.json({
      message: aiMessage,
      conversationId,
      provider: usedProvider,
      model: usedModel,
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
