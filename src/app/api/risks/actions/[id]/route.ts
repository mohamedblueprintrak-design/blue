import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const action = await db.riskAction.findUnique({
      where: { id },
    });

    if (!action) {
      return NextResponse.json({ error: "Risk action not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.description !== undefined) updateData.description = body.description;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId || null;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.completed !== undefined) updateData.completed = Boolean(body.completed);

    const updated = await db.riskAction.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating risk action:", error);
    return NextResponse.json({ error: "Failed to update risk action" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.riskAction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting risk action:", error);
    return NextResponse.json({ error: "Failed to delete risk action" }, { status: 500 });
  }
}
