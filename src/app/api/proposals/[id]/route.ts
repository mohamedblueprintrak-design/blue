import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true, phone: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, clientId, projectId, status, notes, items } = body;

    const existing = await db.proposal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    let subtotal = existing.subtotal;
    let tax = existing.tax;
    let total = existing.total;

    if (items && Array.isArray(items)) {
      subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
      tax = subtotal * 0.05;
      total = subtotal + tax;

      await db.proposalItem.deleteMany({ where: { proposalId: id } });
      await db.proposalItem.createMany({
        data: items.map((item: { description: string; quantity: number; unitPrice: number; total: number }) => ({
          proposalId: id,
          description: item.description || "",
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          total: item.total || (item.quantity * item.unitPrice),
        })),
      });
    }

    const proposal = await db.proposal.update({
      where: { id },
      data: {
        number: number !== undefined ? number : existing.number,
        clientId: clientId !== undefined ? clientId : existing.clientId,
        projectId: projectId !== undefined ? projectId : existing.projectId,
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        subtotal,
        tax,
        total,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.proposalItem.deleteMany({ where: { proposalId: id } });
    await db.proposal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
