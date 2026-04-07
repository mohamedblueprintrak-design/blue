import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const drawing = await db.designDrawing.findUnique({
      where: { id },
      include: {
        designPhase: {
          select: {
            id: true,
            phase: true,
            phaseNameAr: true,
            phaseNameEn: true,
            project: {
              select: { id: true, name: true, nameEn: true, number: true },
            },
          },
        },
        revisions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Design drawing not found" }, { status: 404 });
    }

    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error fetching design drawing:", error);
    return NextResponse.json({ error: "Failed to fetch design drawing" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, drawingNumber, discipline, version, filePath, fileSize, status, reviewedBy, reviewNotes, reviewedAt, clashDetected, clashNotes } = body;

    const drawData: Record<string, unknown> = {};
    if (title !== undefined) drawData.title = title;
    if (drawingNumber !== undefined) drawData.drawingNumber = drawingNumber;
    if (discipline !== undefined) drawData.discipline = discipline;
    if (version !== undefined) drawData.version = parseInt(version) || 1;
    if (filePath !== undefined) drawData.filePath = filePath;
    if (fileSize !== undefined) drawData.fileSize = fileSize;
    if (status !== undefined) drawData.status = status;
    if (reviewedBy !== undefined) drawData.reviewedBy = reviewedBy || null;
    if (reviewNotes !== undefined) drawData.reviewNotes = reviewNotes;
    if (reviewedAt !== undefined) drawData.reviewedAt = reviewedAt ? new Date(reviewedAt) : null;
    if (clashDetected !== undefined) drawData.clashDetected = clashDetected;
    if (clashNotes !== undefined) drawData.clashNotes = clashNotes;

    const updatedDrawing = await db.designDrawing.update({
      where: { id },
      data: drawData,
      include: {
        designPhase: {
          select: { id: true, phase: true, phaseNameAr: true, phaseNameEn: true },
        },
        revisions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedDrawing);
  } catch (error) {
    console.error("Error updating design drawing:", error);
    return NextResponse.json({ error: "Failed to update design drawing" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.designDrawing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting design drawing:", error);
    return NextResponse.json({ error: "Failed to delete design drawing" }, { status: 500 });
  }
}
