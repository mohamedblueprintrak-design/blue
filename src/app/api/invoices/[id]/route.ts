import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true, phone: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, clientId, projectId, issueDate, dueDate, status, paidAmount, items } = body;

    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    let subtotal = existing.subtotal;
    let tax = existing.tax;
    let total = existing.total;

    if (items && Array.isArray(items)) {
      subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
      tax = subtotal * 0.05;
      total = subtotal + tax;

      // Delete old items and create new ones
      await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await db.invoiceItem.createMany({
        data: items.map((item: { description: string; quantity: number; unitPrice: number; total: number }) => ({
          invoiceId: id,
          description: item.description || "",
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          total: item.total || (item.quantity * item.unitPrice),
        })),
      });
    }

    const newPaid = paidAmount !== undefined ? parseFloat(String(paidAmount)) : existing.paidAmount;
    const newRemaining = total - newPaid;

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        number: number !== undefined ? number : existing.number,
        clientId: clientId !== undefined ? clientId : existing.clientId,
        projectId: projectId !== undefined ? projectId : existing.projectId,
        issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        status: status !== undefined ? status : existing.status,
        subtotal,
        tax,
        total,
        paidAmount: newPaid,
        remaining: Math.max(0, newRemaining),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
