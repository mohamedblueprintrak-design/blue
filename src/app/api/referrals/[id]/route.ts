import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, discountGiven, rewardAmount, notes } = body;

    const existing = await db.referral.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    const referral = await db.referral.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(discountGiven !== undefined && { discountGiven: parseFloat(String(discountGiven)) }),
        ...(rewardAmount !== undefined && { rewardAmount: parseFloat(String(rewardAmount)) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(referral);
  } catch (error) {
    console.error("Error updating referral:", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.referral.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    await db.referral.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting referral:", error);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}
