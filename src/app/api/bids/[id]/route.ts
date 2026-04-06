import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bid = await db.bid.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    return NextResponse.json(bid);
  } catch (error) {
    console.error("Error fetching bid:", error);
    return NextResponse.json({ error: "Failed to fetch bid" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contractorName, contractorContact, amount, notes, status } = body;

    const existing = await db.bid.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    const bid = await db.bid.update({
      where: { id },
      data: {
        contractorName: contractorName !== undefined ? contractorName : existing.contractorName,
        contractorContact: contractorContact !== undefined ? contractorContact : existing.contractorContact,
        amount: amount !== undefined ? parseFloat(String(amount)) : existing.amount,
        notes: notes !== undefined ? notes : existing.notes,
        status: status !== undefined ? status : existing.status,
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
      },
    });

    return NextResponse.json(bid);
  } catch (error) {
    console.error("Error updating bid:", error);
    return NextResponse.json({ error: "Failed to update bid" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.bid.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bid:", error);
    return NextResponse.json({ error: "Failed to delete bid" }, { status: 500 });
  }
}
