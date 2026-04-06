import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const siteDiary = await db.siteDiary.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    if (!siteDiary) {
      return NextResponse.json({ error: "Site diary not found" }, { status: 404 });
    }

    return NextResponse.json(siteDiary);
  } catch (error) {
    console.error("Error fetching site diary:", error);
    return NextResponse.json({ error: "Failed to fetch site diary" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, weather, workerCount, workDescription, issues, safetyNotes, equipment, materials, photos } = body;

    const siteDiary = await db.siteDiary.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(weather !== undefined && { weather }),
        ...(workerCount !== undefined && { workerCount: parseInt(workerCount) || 0 }),
        ...(workDescription !== undefined && { workDescription }),
        ...(issues !== undefined && { issues }),
        ...(safetyNotes !== undefined && { safetyNotes }),
        ...(equipment !== undefined && { equipment }),
        ...(materials !== undefined && { materials }),
        ...(photos !== undefined && { photos }),
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(siteDiary);
  } catch (error) {
    console.error("Error updating site diary:", error);
    return NextResponse.json({ error: "Failed to update site diary" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.siteDiary.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site diary:", error);
    return NextResponse.json({ error: "Failed to delete site diary" }, { status: 500 });
  }
}
