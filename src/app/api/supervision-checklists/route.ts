import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (stage) where.stage = stage;
    if (status) where.status = status;

    const checklists = await db.supervisionChecklist.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        items: true,
        violations: true,
      },
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error("Error fetching supervision checklists:", error);
    return NextResponse.json({ error: "Failed to fetch supervision checklists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId, stage, title, visitDate, engineerId, weather, temperature,
      workerCount, contractorName, progressOverall, notes, status, items, violations
    } = body;

    if (!projectId || !visitDate) {
      return NextResponse.json({ error: "Project ID and visit date are required" }, { status: 400 });
    }

    const checklist = await db.supervisionChecklist.create({
      data: {
        projectId,
        stage: stage || "",
        title: title || "",
        visitDate: new Date(visitDate),
        engineerId: engineerId || null,
        weather: weather || "",
        temperature: temperature || "",
        workerCount: workerCount ? parseInt(workerCount) : 0,
        contractorName: contractorName || "",
        progressOverall: progressOverall ? parseFloat(progressOverall) : 0,
        notes: notes || "",
        status: status || "draft",
        items: items ? {
          create: items.map((item: Record<string, unknown>) => ({
            category: item.category || "",
            description: item.description || "",
            specification: item.specification || "",
            isChecked: item.isChecked || false,
            compliant: item.compliant !== undefined ? item.compliant : true,
            notes: item.notes || "",
            photoUrl: item.photoUrl || "",
          })),
        } : undefined,
        violations: violations ? {
          create: violations.map((v: Record<string, unknown>) => ({
            projectId,
            type: v.type || "",
            severity: v.severity || "low",
            description: v.description || "",
            contractorName: v.contractorName || contractorName || "",
            deadline: v.deadline ? new Date(v.deadline) : null,
            status: v.status || "open",
            photoBefore: v.photoBefore || "",
            photoAfter: v.photoAfter || "",
            resolutionNotes: v.resolutionNotes || "",
          })),
        } : undefined,
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: true,
        violations: true,
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error("Error creating supervision checklist:", error);
    return NextResponse.json({ error: "Failed to create supervision checklist" }, { status: 500 });
  }
}
