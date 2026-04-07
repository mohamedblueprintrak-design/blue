import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const referrerId = searchParams.get("referrerId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (referrerId) where.referrerId = referrerId;

    const referrals = await db.referral.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerId, referredName, referredPhone, referredEmail, projectId, notes } = body;

    if (!referrerId) {
      return NextResponse.json({ error: "Referrer is required" }, { status: 400 });
    }

    const referral = await db.referral.create({
      data: {
        referrerId,
        referredName: referredName || "",
        referredPhone: referredPhone || "",
        referredEmail: referredEmail || "",
        projectId: projectId || null,
        notes: notes || "",
      },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
