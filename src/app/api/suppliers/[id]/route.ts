import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          include: {
            project: { select: { id: true, number: true, name: true, nameEn: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
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
    const body = await request.json();
    const { name, category, email, phone, address, rating, creditLimit } = body;

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        category: category !== undefined ? category : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        rating: rating !== undefined ? parseInt(rating) : undefined,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
      },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
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

    // Check if supplier has purchase orders
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true } } },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    if (supplier._count.purchaseOrders > 0) {
      return NextResponse.json(
        { error: "Cannot delete supplier with existing purchase orders" },
        { status: 400 }
      );
    }

    await db.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
