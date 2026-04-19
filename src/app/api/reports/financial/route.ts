import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Invoice stats
    const invoiceStats = await db.invoice.aggregate({
      _sum: { paidAmount: true, remaining: true, total: true },
    });

    const collectedInvoices = invoiceStats._sum.paidAmount || 0;
    const _totalRemaining = invoiceStats._sum.remaining || 0;

    const pendingInvoices = await db.invoice.aggregate({
      _sum: { remaining: true },
      where: { status: { in: ["sent", "partially_paid"] } },
    });

    const overdueInvoices = await db.invoice.aggregate({
      _sum: { remaining: true },
      where: { status: "overdue" },
    });

    const overdueCount = await db.invoice.count({
      where: { status: "overdue" },
    });

    // Top clients by revenue (sum of invoice totals per client)
    const clientRevenue = await db.invoice.groupBy({
      by: ["clientId"],
      _sum: { total: true, paidAmount: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    });

    const topClients = await Promise.all(
      clientRevenue.map(async (cr) => {
        const client = await db.client.findUnique({
          where: { id: cr.clientId },
          select: { id: true, name: true, company: true },
        });
        return {
          clientId: cr.clientId,
          clientName: client?.name || "",
          clientCompany: client?.company || "",
          totalRevenue: cr._sum.total || 0,
          collectedAmount: cr._sum.paidAmount || 0,
          outstanding: (cr._sum.total || 0) - (cr._sum.paidAmount || 0),
        };
      })
    );

    // Monthly revenue vs expenses (last 6 months)
    const now = new Date();
    const monthlyData: Array<{ monthAr: string; monthEn: string; monthIndex: number; year: number; invoiced: number; collected: number; expenses: number }> = [];

    const arMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthRevenue = await db.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "cancelled" },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      const monthCollected = await db.invoice.aggregate({
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
        invoiced: monthRevenue._sum.total || 0,
        collected: monthCollected._sum.paidAmount || 0,
        expenses: monthExpenses._sum.amount || 0,
      });
    }

    return NextResponse.json({
      collectedInvoices,
      pendingInvoices: pendingInvoices._sum.remaining || 0,
      overdueInvoices: overdueInvoices._sum.remaining || 0,
      overdueCount,
      topClients,
      monthlyData,
    });
  } catch (error) {
    console.error("Error fetching financial report:", error);
    return NextResponse.json({ error: "Failed to fetch financial report" }, { status: 500 });
  }
}
