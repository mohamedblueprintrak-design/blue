import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const campaigns = await db.marketingCampaign.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching marketing campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch marketing campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, budget, leads, conversions, startDate, endDate, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    const campaign = await db.marketingCampaign.create({
      data: {
        name,
        type: type || "",
        budget: parseFloat(String(budget)) || 0,
        spent: 0,
        leads: parseInt(String(leads)) || 0,
        conversions: parseInt(String(conversions)) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || "",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating marketing campaign:", error);
    return NextResponse.json({ error: "Failed to create marketing campaign" }, { status: 500 });
  }
}
