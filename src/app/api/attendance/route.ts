import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Record<string, unknown> = {};

    if (employeeId && employeeId !== "all") {
      where.employeeId = employeeId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        (where.date as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.date as Record<string, unknown>).lte = new Date(dateTo);
      }
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { checkIn: "desc" }],
    });

    // Summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = await db.attendance.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    });

    const summary = {
      present: todayRecords.filter((r) => r.status === "present").length,
      absent: todayRecords.filter((r) => r.status === "absent").length,
      late: todayRecords.filter((r) => r.status === "late").length,
      leave: todayRecords.filter((r) => r.status === "leave").length,
      totalEmployees: await db.employee.count(),
    };

    return NextResponse.json({ records: attendance, summary });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, checkIn, checkOut, status, workHours, overtimeHours } = body;

    if (!employeeId || !date) {
      return NextResponse.json({ error: "employeeId and date are required" }, { status: 400 });
    }

    // Check for existing record
    const existing = await db.attendance.findFirst({
      where: {
        employeeId,
        date: new Date(date),
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Attendance record already exists for this employee and date" }, { status: 400 });
    }

    const attendance = await db.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn || "",
        checkOut: checkOut || "",
        status: status || "present",
        workHours: parseFloat(workHours) || 0,
        overtimeHours: parseFloat(overtimeHours) || 0,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to create attendance record" }, { status: 500 });
  }
}
