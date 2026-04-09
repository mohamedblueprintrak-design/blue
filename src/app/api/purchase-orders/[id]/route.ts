import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
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
    const { number, supplierId, projectId, amount, status, items } = body;

    // If items are provided, delete old ones and create new
    if (items !== undefined) {
      await db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    }

    const order = await db.purchaseOrder.update({
      where: { id },
      data: {
        number: number !== undefined ? number : undefined,
        supplierId: supplierId !== undefined ? supplierId : undefined,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
        amount: amount !== undefined ? parseFloat(String(amount)) : undefined,
        status: status !== undefined ? status : undefined,
        items: items !== undefined && items.length > 0
          ? {
              create: items.map((item: { itemName: string; quantity: number; unitPrice: number; total: number }) => ({
                itemName: item.itemName,
                quantity: parseFloat(String(item.quantity)) || 1,
                unitPrice: parseFloat(String(item.unitPrice)) || 0,
                total: parseFloat(String(item.total)) || 0,
              })),
            }
          : undefined,
      },
      include: {
        supplier: true,
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
        items: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
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

    await db.purchaseOrder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}
