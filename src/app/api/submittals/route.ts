import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const submittals = await db.submittal.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submittals);
  } catch (error) {
    console.error("Error fetching submittals:", error);
    return NextResponse.json({ error: "Failed to fetch submittals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, number, title, type, contractor, revisionNumber, status } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "Project ID and title are required" }, { status: 400 });
    }

    const submittal = await db.submittal.create({
      data: {
        projectId,
        number: number || "",
        title,
        type: type || "",
        contractor: contractor || "",
        revisionNumber: revisionNumber ? parseInt(revisionNumber) : 1,
        status: status || "under_review",
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(submittal, { status: 201 });
  } catch (error) {
    console.error("Error creating submittal:", error);
    return NextResponse.json({ error: "Failed to create submittal" }, { status: 500 });
  }
}
