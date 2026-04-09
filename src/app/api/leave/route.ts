import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/leave
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (employeeId && employeeId !== "all") {
      where.employeeId = employeeId;
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const leaves = await db.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            position: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingCount, approvedThisMonth, onLeaveToday] = await Promise.all([
      db.leave.count({ where: { status: "pending" } }),
      db.leave.count({
        where: {
          status: "approved",
          startDate: { gte: startOfMonth },
        },
      }),
      db.leave.count({
        where: {
          status: "approved",
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
    ]);

    const summary = {
      pending: pendingCount,
      approvedThisMonth,
      onLeaveToday,
    };

    return NextResponse.json({ records: leaves, summary });
  } catch (error) {
    console.error("GET /api/leave error:", error);
    return NextResponse.json({ error: "Failed to fetch leave records" }, { status: 500 });
  }
}

// POST /api/leave
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, type, startDate, endDate, days, reason } = body;

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "employeeId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const leave = await db.leave.create({
      data: {
        employeeId,
        type: type || "annual",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseInt(days) || 1,
        reason: reason || "",
        status: "pending",
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            position: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("POST /api/leave error:", error);
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}
