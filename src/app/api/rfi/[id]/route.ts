import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfi = await db.rFI.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        to: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!rfi) {
      return NextResponse.json({ error: "RFI not found" }, { status: 404 });
    }

    return NextResponse.json(rfi);
  } catch (error) {
    console.error("Error fetching RFI:", error);
    return NextResponse.json({ error: "Failed to fetch RFI" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, subject, description, priority, dueDate, response, status } = body;

    const rfi = await db.rFI.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(subject !== undefined && { subject }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(response !== undefined && { response }),
        ...(status !== undefined && { status }),
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        to: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(rfi);
  } catch (error) {
    console.error("Error updating RFI:", error);
    return NextResponse.json({ error: "Failed to update RFI" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.rFI.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting RFI:", error);
    return NextResponse.json({ error: "Failed to delete RFI" }, { status: 500 });
  }
}
