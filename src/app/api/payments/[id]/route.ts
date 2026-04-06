import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        approver: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedById, amount, payMethod, beneficiary, referenceNumber, description } = body;

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = await db.payment.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        approvedById: approvedById !== undefined ? approvedById : existing.approvedById,
        amount: amount !== undefined ? parseFloat(String(amount)) : existing.amount,
        payMethod: payMethod !== undefined ? payMethod : existing.payMethod,
        beneficiary: beneficiary !== undefined ? beneficiary : existing.beneficiary,
        referenceNumber: referenceNumber !== undefined ? referenceNumber : existing.referenceNumber,
        description: description !== undefined ? description : existing.description,
      },
      include: {
        approver: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
