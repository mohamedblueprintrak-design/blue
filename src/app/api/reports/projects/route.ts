import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Project stats by status
    const totalProjects = await db.project.count();
    const activeProjects = await db.project.count({ where: { status: "active" } });
    const completedProjects = await db.project.count({ where: { status: "completed" } });
    const delayedProjects = await db.project.count({ where: { status: "delayed" } });
    const onHoldProjects = await db.project.count({ where: { status: "on_hold" } });
    const cancelledProjects = await db.project.count({ where: { status: "cancelled" } });

    // Project details with progress and budget
    const projects = await db.project.findMany({
      select: {
        id: true,
        number: true,
        name: true,
        nameEn: true,
        status: true,
        progress: true,
        budget: true,
        startDate: true,
        endDate: true,
        client: { select: { name: true, company: true } },
        tasks: { select: { status: true } },
        invoices: { select: { total: true, paidAmount: true } },
        payments: { select: { amount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Budget vs Actual comparison per project
    const projectBudgetData = projects.map((p) => {
      const totalInvoiced = p.invoices.reduce((s, i) => s + i.total, 0);
      const totalPaid = p.payments.filter((py) => py.status === "completed").reduce((s, py) => s + py.amount, 0);
      const completedTasks = p.tasks.filter((t) => t.status === "done").length;
      const totalTasks = p.tasks.length;
      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        number: p.number,
        name: p.name,
        nameEn: p.nameEn,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        totalInvoiced,
        totalPaid,
        completedTasks,
        totalTasks,
        taskProgress,
        clientName: p.client?.name || "",
        clientCompany: p.client?.company || "",
      };
    });

    // Overall budget summary
    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalInvoiced = projectBudgetData.reduce((s, p) => s + p.totalInvoiced, 0);
    const totalSpent = projectBudgetData.reduce((s, p) => s + p.totalPaid, 0);

    return NextResponse.json({
      stats: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        delayed: delayedProjects,
        onHold: onHoldProjects,
        cancelled: cancelledProjects,
      },
      budgetSummary: {
        totalBudget,
        totalInvoiced,
        totalSpent,
        remaining: totalBudget - totalSpent,
      },
      projects: projectBudgetData,
    });
  } catch (error) {
    console.error("Error fetching projects report:", error);
    return NextResponse.json({ error: "Failed to fetch projects report" }, { status: 500 });
  }
}
