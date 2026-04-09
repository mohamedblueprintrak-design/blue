import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;

    const violations = await db.violation.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(violations);
  } catch (error) {
    console.error("Error fetching violations:", error);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      checklistId, projectId, type, severity, description,
      contractorName, deadline, status, photoBefore, photoAfter, resolutionNotes
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const violation = await db.violation.create({
      data: {
        checklistId: checklistId || null,
        projectId,
        type: type || "",
        severity: severity || "low",
        description: description || "",
        contractorName: contractorName || "",
        deadline: deadline ? new Date(deadline) : null,
        status: status || "open",
        photoBefore: photoBefore || "",
        photoAfter: photoAfter || "",
        resolutionNotes: resolutionNotes || "",
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(violation, { status: 201 });
  } catch (error) {
    console.error("Error creating violation:", error);
    return NextResponse.json({ error: "Failed to create violation" }, { status: 500 });
  }
}
