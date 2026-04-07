import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const violation = await db.violation.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    if (!violation) {
      return NextResponse.json({ error: "Violation not found" }, { status: 404 });
    }

    return NextResponse.json(violation);
  } catch (error) {
    console.error("Error fetching violation:", error);
    return NextResponse.json({ error: "Failed to fetch violation" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, severity, description, contractorName, deadline, status, photoBefore, photoAfter, resolutionNotes } = body;

    const violation = await db.violation.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(severity !== undefined && { severity }),
        ...(description !== undefined && { description }),
        ...(contractorName !== undefined && { contractorName }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status !== undefined && { status }),
        ...(photoBefore !== undefined && { photoBefore }),
        ...(photoAfter !== undefined && { photoAfter }),
        ...(resolutionNotes !== undefined && { resolutionNotes }),
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(violation);
  } catch (error) {
    console.error("Error updating violation:", error);
    return NextResponse.json({ error: "Failed to update violation" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.violation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting violation:", error);
    return NextResponse.json({ error: "Failed to delete violation" }, { status: 500 });
  }
}
