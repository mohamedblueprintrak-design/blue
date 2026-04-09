import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedById, paidDate } = body;

    const existing = await db.commission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    const commission = await db.commission.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(approvedById !== undefined && { approvedById }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(status === "paid" && !paidDate && { paidDate: new Date() }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Error updating commission:", error);
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.commission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    await db.commission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting commission:", error);
    return NextResponse.json({ error: "Failed to delete commission" }, { status: 500 });
  }
}
