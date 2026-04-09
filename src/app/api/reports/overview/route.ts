import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Revenue: sum of paidAmount from all invoices
    const revenueResult = await db.invoice.aggregate({
      _sum: { paidAmount: true },
    });

    // Expenses: sum of completed payments
    const expensesResult = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "completed" },
    });

    const revenue = revenueResult._sum.paidAmount || 0;
    const expenses = expensesResult._sum.amount || 0;
    const profit = revenue - expenses;

    // Completed projects
    const completedProjects = await db.project.count({
      where: { status: "completed" },
    });

    // Active tasks (not done/cancelled)
    const activeTasks = await db.task.count({
      where: { status: { in: ["todo", "in_progress", "review"] } },
    });

    // Total projects and tasks for context
    const totalProjects = await db.project.count();
    const totalTasks = await db.task.count();

    // Monthly revenue data (last 6 months)
    const now = new Date();
    const monthlyData: Array<{ monthAr: string; monthEn: string; monthIndex: number; year: number; revenue: number; expenses: number }> = [];

    const arMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthRevenue = await db.invoice.aggregate({
        _sum: { paidAmount: true },
        where: {
          status: { in: ["paid", "partially_paid"] },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      const monthExpenses = await db.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "completed",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      monthlyData.push({
        monthAr: arMonths[monthStart.getMonth()],
        monthEn: enMonths[monthStart.getMonth()],
        monthIndex: monthStart.getMonth(),
        year: monthStart.getFullYear(),
        revenue: monthRevenue._sum.paidAmount || 0,
        expenses: monthExpenses._sum.amount || 0,
      });
    }

    return NextResponse.json({
      revenue,
      expenses,
      profit,
      completedProjects,
      activeTasks,
      totalProjects,
      totalTasks,
      monthlyData,
    });
  } catch (error) {
    console.error("Error fetching overview report:", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
