import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, budget, spent, leads, conversions, startDate, endDate, status, notes } = body;

    const existing = await db.marketingCampaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = await db.marketingCampaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(budget !== undefined && { budget: parseFloat(String(budget)) }),
        ...(spent !== undefined && { spent: parseFloat(String(spent)) }),
        ...(leads !== undefined && { leads: parseInt(String(leads)) }),
        ...(conversions !== undefined && { conversions: parseInt(String(conversions)) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating marketing campaign:", error);
    return NextResponse.json({ error: "Failed to update marketing campaign" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.marketingCampaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await db.marketingCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting marketing campaign:", error);
    return NextResponse.json({ error: "Failed to delete marketing campaign" }, { status: 500 });
  }
}
