import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const siteDiaries = await db.siteDiary.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(siteDiaries);
  } catch (error) {
    console.error("Error fetching site diaries:", error);
    return NextResponse.json({ error: "Failed to fetch site diaries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, date, weather, workerCount, workDescription, issues, safetyNotes, equipment, materials, photos } = body;

    if (!projectId || !date) {
      return NextResponse.json({ error: "Project ID and date are required" }, { status: 400 });
    }

    const siteDiary = await db.siteDiary.create({
      data: {
        projectId,
        date: new Date(date),
        weather: weather || "",
        workerCount: workerCount ? parseInt(workerCount) : 0,
        workDescription: workDescription || "",
        issues: issues || "",
        safetyNotes: safetyNotes || "",
        equipment: equipment || "",
        materials: materials || "",
        photos: photos || "",
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(siteDiary, { status: 201 });
  } catch (error) {
    console.error("Error creating site diary:", error);
    return NextResponse.json({ error: "Failed to create site diary" }, { status: 500 });
  }
}
