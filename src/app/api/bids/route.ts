import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const bids = await db.bid.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, contractorName, contractorContact, amount, notes, status } = body;

    if (!projectId || !contractorName) {
      return NextResponse.json({ error: "Project and contractor name are required" }, { status: 400 });
    }

    const bid = await db.bid.create({
      data: {
        projectId,
        contractorName,
        contractorContact: contractorContact || "",
        amount: amount ? parseFloat(String(amount)) : 0,
        notes: notes || "",
        status: status || "submitted",
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 });
  }
}
