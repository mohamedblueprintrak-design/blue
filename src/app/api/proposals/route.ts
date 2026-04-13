import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { validateRequest, proposalSchema } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const proposals = await db.proposal.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        items: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequest(proposalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, errors: validation.errors }, { status: 400 });
    }

    const { number, clientId, projectId, status, items, notes } = body;

    const lineItems = items || [];
    const subtotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const proposal = await db.proposal.create({
      data: {
        number: number || "",
        clientId,
        projectId: projectId || null,
        status: status || "draft",
        subtotal,
        tax,
        total,
        notes: notes || "",
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

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
