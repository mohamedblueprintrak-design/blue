import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const checklist = await db.supervisionChecklist.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
        violations: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: "Supervision checklist not found" }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Error fetching supervision checklist:", error);
    return NextResponse.json({ error: "Failed to fetch supervision checklist" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      stage, title, visitDate, engineerId, weather, temperature,
      workerCount, contractorName, progressOverall, notes, status, approvedById
    } = body;

    const checklist = await db.supervisionChecklist.update({
      where: { id },
      data: {
        ...(stage !== undefined && { stage }),
        ...(title !== undefined && { title }),
        ...(visitDate && { visitDate: new Date(visitDate) }),
        ...(engineerId !== undefined && { engineerId }),
        ...(weather !== undefined && { weather }),
        ...(temperature !== undefined && { temperature }),
        ...(workerCount !== undefined && { workerCount: parseInt(workerCount) || 0 }),
        ...(contractorName !== undefined && { contractorName }),
        ...(progressOverall !== undefined && { progressOverall: parseFloat(progressOverall) || 0 }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(approvedById !== undefined && { approvedById }),
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: true,
        violations: true,
      },
    });

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Error updating supervision checklist:", error);
    return NextResponse.json({ error: "Failed to update supervision checklist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.supervisionChecklist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supervision checklist:", error);
    return NextResponse.json({ error: "Failed to delete supervision checklist" }, { status: 500 });
  }
}
