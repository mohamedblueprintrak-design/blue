import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const payments = await db.payment.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        approver: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voucherNumber, projectId, amount, payMethod, beneficiary, referenceNumber, description } = body;

    if (!amount || !payMethod) {
      return NextResponse.json({ error: "Amount and payment method are required" }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        voucherNumber: voucherNumber || "",
        projectId: projectId || null,
        amount: parseFloat(String(amount)),
        payMethod: payMethod || "transfer",
        beneficiary: beneficiary || "",
        referenceNumber: referenceNumber || "",
        description: description || "",
      },
      include: {
        approver: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
