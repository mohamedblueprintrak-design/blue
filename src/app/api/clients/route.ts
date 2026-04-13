import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeObject, sanitizeEmail } from '@/lib/security/sanitize';
import { clientSchema } from '@/lib/validation-schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) {
      where.projects = { some: { id: projectId } };
    }

    const clients = await db.client.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        _count: {
          select: {
            projects: true,
            invoices: true,
            contracts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Zod validation for client fields
    const validation = clientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const validatedData = validation.data;
    const sanitizedEmail = validatedData.email ? sanitizeEmail(validatedData.email) : "";

    const client = await db.client.create({
      data: {
        name: validatedData.name,
        company: validatedData.company || "",
        email: sanitizedEmail,
        phone: validatedData.phone || "",
        address: validatedData.address || "",
        taxNumber: validatedData.taxNumber || "",
        creditLimit: validatedData.creditLimit ? parseFloat(validatedData.creditLimit) : 0,
        paymentTerms: validatedData.paymentTerms || "",
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

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
