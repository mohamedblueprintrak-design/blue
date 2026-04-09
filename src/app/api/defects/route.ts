import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const defects = await db.defect.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(defects);
  } catch (error) {
    console.error("Error fetching defects:", error);
    return NextResponse.json({ error: "Failed to fetch defects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, severity, location, assigneeId, photos, notes, status } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "Project ID and title are required" }, { status: 400 });
    }

    const defect = await db.defect.create({
      data: {
        projectId,
        title: title || "",
        severity: severity || "normal",
        location: location || "",
        assigneeId: assigneeId || null,
        photos: photos || "",
        resolutionNotes: notes || "",
        status: status || "open",
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    console.error("Error creating defect:", error);
    return NextResponse.json({ error: "Failed to create defect" }, { status: 500 });
  }
}
