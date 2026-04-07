import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const commissions = await db.commission.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(commissions);
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, projectId, type, amount, percentage, baseAmount, description, periodStart, periodEnd } = body;

    if (!userId) {
      return NextResponse.json({ error: "User is required" }, { status: 400 });
    }

    const commission = await db.commission.create({
      data: {
        userId,
        projectId: projectId || null,
        type: type || "project_referral",
        amount: parseFloat(String(amount)) || 0,
        currency: "AED",
        percentage: parseFloat(String(percentage)) || 0,
        baseAmount: parseFloat(String(baseAmount)) || 0,
        description: description || "",
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    console.error("Error creating commission:", error);
    return NextResponse.json({ error: "Failed to create commission" }, { status: 500 });
  }
}
