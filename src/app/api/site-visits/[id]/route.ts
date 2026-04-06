import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const siteVisit = await db.siteVisit.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true, client: { select: { id: true, name: true, company: true } } },
        },
      },
    });

    if (!siteVisit) {
      return NextResponse.json({ error: "Site visit not found" }, { status: 404 });
    }

    return NextResponse.json(siteVisit);
  } catch (error) {
    console.error("Error fetching site visit:", error);
    return NextResponse.json({ error: "Failed to fetch site visit" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, plotNumber, municipality, gateDescription, neighborDesc, buildingDesc, status, photos, notes } = body;

    const siteVisit = await db.siteVisit.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(plotNumber !== undefined && { plotNumber }),
        ...(municipality !== undefined && { municipality }),
        ...(gateDescription !== undefined && { gateDescription }),
        ...(neighborDesc !== undefined && { neighborDesc }),
        ...(buildingDesc !== undefined && { buildingDesc }),
        ...(status !== undefined && { status }),
        ...(photos !== undefined && { photos }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true, client: { select: { id: true, name: true, company: true } } },
        },
      },
    });

    return NextResponse.json(siteVisit);
  } catch (error) {
    console.error("Error updating site visit:", error);
    return NextResponse.json({ error: "Failed to update site visit" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.siteVisit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site visit:", error);
    return NextResponse.json({ error: "Failed to delete site visit" }, { status: 500 });
  }
}
