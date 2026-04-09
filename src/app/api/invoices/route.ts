import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;

    const invoices = await db.invoice.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, clientId, projectId, issueDate, dueDate, status, items } = body;

    if (!clientId || !projectId || !issueDate || !dueDate) {
      return NextResponse.json({ error: "Client, project, and dates are required" }, { status: 400 });
    }

    const lineItems = items || [];
    const subtotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const invoice = await db.invoice.create({
      data: {
        number: number || "",
        clientId,
        projectId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: status || "draft",
        subtotal,
        tax,
        total,
        remaining: total,
        items: {
          create: lineItems.map((item: { description: string; quantity: number; unitPrice: number; total: number }) => ({
            description: item.description || "",
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: item.total || (item.quantity * item.unitPrice),
          })),
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
