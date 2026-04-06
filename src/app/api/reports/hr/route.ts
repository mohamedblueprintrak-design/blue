import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Employee count by department
    const employees = await db.employee.findMany({
      include: {
        user: { select: { name: true, email: true, isActive: true } },
      },
    });

    const deptCounts: Record<string, number> = {};
    const deptEmployees: Record<string, { name: string; position: string }[]> = {};
    employees.forEach((emp) => {
      const dept = emp.department || "غير محدد";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      if (!deptEmployees[dept]) deptEmployees[dept] = [];
      deptEmployees[dept].push({ name: emp.user?.name || "", position: emp.position });
    });

    const departmentDistribution = Object.entries(deptCounts).map(([dept, count]) => ({
      department: dept,
      count,
      employees: deptEmployees[dept],
    }));

    // Today's attendance stats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todayAttendance = await db.attendance.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    const presentToday = todayAttendance.filter((a) => a.status === "present" || a.status === "late").length;
    const absentToday = todayAttendance.filter((a) => a.status === "absent").length;
    const lateToday = todayAttendance.filter((a) => a.status === "late").length;
    const onLeaveToday = todayAttendance.filter((a) => a.status === "leave").length;

    // Total employees
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.employmentStatus === "active" && e.user?.isActive !== false).length;

    // Leave stats
    const pendingLeaves = await db.leave.count({
      where: { status: "pending" },
    });

    const approvedLeavesThisMonth = await db.leave.count({
      where: {
        status: "approved",
        startDate: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
      },
    });

    const onLeaveEmployees = await db.leave.findMany({
      where: {
        status: "approved",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        employee: { select: { id: true, name: true, department: true, position: true } },
        approver: { select: { name: true } },
      },
    });

    // Leave distribution by type
    const leaveTypeCounts = await db.leave.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const leaveDistribution = leaveTypeCounts.map((lt) => ({
      type: lt.type,
      count: lt._count.id,
    }));

    // Attendance trends (last 7 days)
    const attendanceTrend: Array<{ dateAr: string; dateEn: string; dayIndex: number; date: string; present: number; absent: number; late: number; leave: number; total: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const dayAttendance = await db.attendance.findMany({
        where: { date: { gte: dateStart, lte: dateEnd } },
      });

      const arDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      attendanceTrend.push({
        dateAr: arDays[date.getDay()],
        dateEn: enDays[date.getDay()],
        dayIndex: date.getDay(),
        date: date.toISOString().split("T")[0],
        present: dayAttendance.filter((a) => a.status === "present").length,
        absent: dayAttendance.filter((a) => a.status === "absent").length,
        late: dayAttendance.filter((a) => a.status === "late").length,
        leave: dayAttendance.filter((a) => a.status === "leave").length,
        total: dayAttendance.length,
      });
    }

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      presentToday,
      absentToday,
      lateToday,
      onLeaveToday,
      onLeaveEmployees,
      pendingLeaves,
      approvedLeavesThisMonth,
      departmentDistribution,
      leaveDistribution,
      attendanceTrend,
    });
  } catch (error) {
    console.error("Error fetching HR report:", error);
    return NextResponse.json({ error: "Failed to fetch HR report" }, { status: 500 });
  }
}
