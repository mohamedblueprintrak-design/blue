import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/employees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const where: Record<string, unknown> = {};
    if (department && department !== "all") {
      where.department = department;
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// POST /api/employees
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, department, position, salary, employmentStatus, hireDate } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Check if employee already exists for this user
    const existing = await db.employee.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json({ error: "Employee already exists for this user" }, { status: 400 });
    }

    const employee = await db.employee.create({
      data: {
        userId,
        department: department || "",
        position: position || "",
        salary: parseFloat(salary) || 0,
        employmentStatus: employmentStatus || "active",
        hireDate: hireDate ? new Date(hireDate) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
