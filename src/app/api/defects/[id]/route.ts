import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const defect = await db.defect.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!defect) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }

    return NextResponse.json(defect);
  } catch (error) {
    console.error("Error fetching defect:", error);
    return NextResponse.json({ error: "Failed to fetch defect" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, severity, location, assigneeId, photos, resolutionNotes, status } = body;

    const defect = await db.defect.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(severity !== undefined && { severity }),
        ...(location !== undefined && { location }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(photos !== undefined && { photos }),
        ...(resolutionNotes !== undefined && { resolutionNotes }),
        ...(status !== undefined && { status }),
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

    return NextResponse.json(defect);
  } catch (error) {
    console.error("Error updating defect:", error);
    return NextResponse.json({ error: "Failed to update defect" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.defect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting defect:", error);
    return NextResponse.json({ error: "Failed to delete defect" }, { status: 500 });
  }
}
