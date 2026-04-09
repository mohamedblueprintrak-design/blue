import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/employees/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const employee = await db.employee.findUnique({
      where: { id },
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
            department: true,
            position: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

// PUT /api/employees/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const employee = await db.employee.update({
      where: { id },
      data: {
        ...(body.department !== undefined && { department: body.department }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.salary !== undefined && { salary: parseFloat(body.salary) || 0 }),
        ...(body.employmentStatus !== undefined && { employmentStatus: body.employmentStatus }),
        ...(body.hireDate !== undefined && {
          hireDate: body.hireDate ? new Date(body.hireDate) : null,
        }),
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

    // Also update the linked user if department/position changed
    if (body.department !== undefined || body.position !== undefined) {
      await db.user.update({
        where: { id: employee.userId },
        data: {
          ...(body.department !== undefined && { department: body.department }),
          ...(body.position !== undefined && { position: body.position }),
        },
      });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

// DELETE /api/employees/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
