import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const phases = await db.designPhase.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        drawings: {
          select: { id: true, status: true, clashDetected: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error("Error fetching design phases:", error);
    return NextResponse.json({ error: "Failed to fetch design phases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, phase, phaseNameAr, phaseNameEn, status, designerId, startDate, dueDate, notes } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const designPhase = await db.designPhase.create({
      data: {
        projectId,
        phase: phase || "concept",
        phaseNameAr: phaseNameAr || "",
        phaseNameEn: phaseNameEn || "",
        status: status || "not_started",
        designerId: designerId || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || "",
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(designPhase, { status: 201 });
  } catch (error) {
    console.error("Error creating design phase:", error);
    return NextResponse.json({ error: "Failed to create design phase" }, { status: 500 });
  }
}
