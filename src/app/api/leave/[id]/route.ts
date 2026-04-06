import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/leave/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const leave = await db.leave.findUnique({
      where: { id },
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

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    return NextResponse.json(leave);
  } catch (error) {
    console.error("GET /api/leave/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch leave request" }, { status: 500 });
  }
}

// PUT /api/leave/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const leave = await db.leave.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.days !== undefined && { days: parseInt(body.days) || 1 }),
        ...(body.reason !== undefined && { reason: body.reason }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.approvedById !== undefined && { approvedById: body.approvedById }),
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

    return NextResponse.json(leave);
  } catch (error) {
    console.error("PUT /api/leave/[id] error:", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}

// DELETE /api/leave/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.leave.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/leave/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete leave request" }, { status: 500 });
  }
}
