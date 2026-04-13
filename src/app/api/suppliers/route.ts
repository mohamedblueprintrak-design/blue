import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, supplierCreateSchema } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const suppliers = await db.supplier.findMany({
      where: category && category !== "all" ? { category } : undefined,
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, supplierCreateSchema);
    if (body instanceof NextResponse) return body;
    const { name, category, email, phone, address, rating, creditLimit } = body;

    const supplier = await db.supplier.create({
      data: {
        name,
        category: category || "materials",
        email: email || "",
        phone: phone || "",
        address: address || "",
        rating: rating || 0,
        creditLimit: creditLimit || 0,
      },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
