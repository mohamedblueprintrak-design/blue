import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeObject, sanitizeEmail } from '@/lib/security/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await db.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            invoices: true,
            contracts: true,
          },
        },
        projects: {
          select: {
            id: true,
            number: true,
            name: true,
            nameEn: true,
            status: true,
            type: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          select: {
            id: true,
            number: true,
            total: true,
            paidAmount: true,
            remaining: true,
            status: true,
            issueDate: true,
            dueDate: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        contracts: {
          select: {
            id: true,
            number: true,
            title: true,
            value: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        interactions: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const {
      name,
      company,
      email,
      phone,
      address,
      taxNumber,
      creditLimit,
      paymentTerms,
    } = body;

    const sanitizedEmail = email !== undefined ? sanitizeEmail(email as string) : undefined;

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(sanitizedEmail !== undefined && { email: sanitizedEmail }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(creditLimit !== undefined && {
          creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        }),
        ...(paymentTerms !== undefined && { paymentTerms }),
      },
      include: {
        _count: {
          select: {
            projects: true,
            invoices: true,
            contracts: true,
          },
        },
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await db.client.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
