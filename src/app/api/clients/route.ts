import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const clients = await db.client.findMany({
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
    const body = await request.json();
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

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        name,
        company: company || "",
        email: email || "",
        phone: phone || "",
        address: address || "",
        taxNumber: taxNumber || "",
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        paymentTerms: paymentTerms || "",
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
