import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designPhaseId = searchParams.get("designPhaseId");

    const where: Record<string, unknown> = {};
    if (designPhaseId) where.designPhaseId = designPhaseId;

    const drawings = await db.designDrawing.findMany({
      where,
      include: {
        designPhase: {
          select: { id: true, phase: true, phaseNameAr: true, phaseNameEn: true },
        },
        revisions: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(drawings);
  } catch (error) {
    console.error("Error fetching design drawings:", error);
    return NextResponse.json({ error: "Failed to fetch design drawings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designPhaseId, title, drawingNumber, discipline, version, filePath, fileSize, status, uploadedById } = body;

    if (!designPhaseId || !title) {
      return NextResponse.json({ error: "Design phase ID and title are required" }, { status: 400 });
    }

    const drawing = await db.designDrawing.create({
      data: {
        designPhaseId,
        title,
        drawingNumber: drawingNumber || "",
        discipline: discipline || "",
        version: version ? parseInt(version) : 1,
        filePath: filePath || "",
        fileSize: fileSize || 0,
        status: status || "draft",
        uploadedById: uploadedById || null,
      },
      include: {
        designPhase: {
          select: { id: true, phase: true, phaseNameAr: true, phaseNameEn: true },
        },
      },
    });

    return NextResponse.json(drawing, { status: 201 });
  } catch (error) {
    console.error("Error creating design drawing:", error);
    return NextResponse.json({ error: "Failed to create design drawing" }, { status: 500 });
  }
}
