import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const municipality = searchParams.get("municipality");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (municipality) where.municipality = municipality;

    const siteVisits = await db.siteVisit.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true, client: { select: { id: true, name: true, company: true } } },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(siteVisits);
  } catch (error) {
    console.error("Error fetching site visits:", error);
    return NextResponse.json({ error: "Failed to fetch site visits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, date, plotNumber, municipality, gateDescription, neighborDesc, buildingDesc, status, photos, notes } = body;

    if (!projectId || !date) {
      return NextResponse.json({ error: "Project ID and date are required" }, { status: 400 });
    }

    const siteVisit = await db.siteVisit.create({
      data: {
        projectId,
        date: new Date(date),
        plotNumber: plotNumber || "",
        municipality: municipality || "",
        gateDescription: gateDescription || "",
        neighborDesc: neighborDesc || "",
        buildingDesc: buildingDesc || "",
        status: status || "draft",
        photos: photos || "",
        notes: notes || "",
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true, client: { select: { id: true, name: true, company: true } } },
        },
      },
    });

    return NextResponse.json(siteVisit, { status: 201 });
  } catch (error) {
    console.error("Error creating site visit:", error);
    return NextResponse.json({ error: "Failed to create site visit" }, { status: 500 });
  }
}
