import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const phase = await db.designPhase.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        drawings: {
          include: {
            revisions: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!phase) {
      return NextResponse.json({ error: "Design phase not found" }, { status: 404 });
    }

    return NextResponse.json(phase);
  } catch (error) {
    console.error("Error fetching design phase:", error);
    return NextResponse.json({ error: "Failed to fetch design phase" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { phase, phaseNameAr, phaseNameEn, status, designerId, startDate, dueDate, completedDate, revisionCount, notes, clientApproval } = body;

    const phaseData: Record<string, unknown> = {};
    if (phase !== undefined) phaseData.phase = phase;
    if (phaseNameAr !== undefined) phaseData.phaseNameAr = phaseNameAr;
    if (phaseNameEn !== undefined) phaseData.phaseNameEn = phaseNameEn;
    if (status !== undefined) phaseData.status = status;
    if (designerId !== undefined) phaseData.designerId = designerId || null;
    if (startDate !== undefined) phaseData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) phaseData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completedDate !== undefined) phaseData.completedDate = completedDate ? new Date(completedDate) : null;
    if (revisionCount !== undefined) phaseData.revisionCount = revisionCount;
    if (notes !== undefined) phaseData.notes = notes;
    if (clientApproval !== undefined) phaseData.clientApproval = clientApproval;

    const updatedPhase = await db.designPhase.update({
      where: { id },
      data: phaseData,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        drawings: {
          select: { id: true, status: true, clashDetected: true },
        },
      },
    });

    return NextResponse.json(updatedPhase);
  } catch (error) {
    console.error("Error updating design phase:", error);
    return NextResponse.json({ error: "Failed to update design phase" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.designPhase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting design phase:", error);
    return NextResponse.json({ error: "Failed to delete design phase" }, { status: 500 });
  }
}
