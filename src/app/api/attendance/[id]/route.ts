import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendance = await db.attendance.findUnique({
      where: { id },
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

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("GET /api/attendance/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance record" }, { status: 500 });
  }
}

// PUT /api/attendance/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const attendance = await db.attendance.update({
      where: { id },
      data: {
        ...(body.checkIn !== undefined && { checkIn: body.checkIn }),
        ...(body.checkOut !== undefined && { checkOut: body.checkOut }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.workHours !== undefined && { workHours: parseFloat(body.workHours) || 0 }),
        ...(body.overtimeHours !== undefined && { overtimeHours: parseFloat(body.overtimeHours) || 0 }),
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

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("PUT /api/attendance/[id] error:", error);
    return NextResponse.json({ error: "Failed to update attendance record" }, { status: 500 });
  }
}

// DELETE /api/attendance/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/attendance/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete attendance record" }, { status: 500 });
  }
}
