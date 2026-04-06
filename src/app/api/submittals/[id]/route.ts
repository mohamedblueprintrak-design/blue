import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const submittal = await db.submittal.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    if (!submittal) {
      return NextResponse.json({ error: "Submittal not found" }, { status: 404 });
    }

    return NextResponse.json(submittal);
  } catch (error) {
    console.error("Error fetching submittal:", error);
    return NextResponse.json({ error: "Failed to fetch submittal" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, title, type, contractor, revisionNumber, status } = body;

    const submittal = await db.submittal.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(contractor !== undefined && { contractor }),
        ...(revisionNumber !== undefined && { revisionNumber: parseInt(revisionNumber) || 1 }),
        ...(status !== undefined && { status }),
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(submittal);
  } catch (error) {
    console.error("Error updating submittal:", error);
    return NextResponse.json({ error: "Failed to update submittal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.submittal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting submittal:", error);
    return NextResponse.json({ error: "Failed to delete submittal" }, { status: 500 });
  }
}
