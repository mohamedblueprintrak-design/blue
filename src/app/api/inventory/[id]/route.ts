import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      totalValue: item.quantity * item.price,
      isLowStock: item.minimumLevel > 0 && item.quantity <= item.minimumLevel,
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
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
    const { name, projectId, quantity, unit, price, location, minimumLevel } = body;

    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit: unit !== undefined ? unit : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        location: location !== undefined ? location : undefined,
        minimumLevel: minimumLevel !== undefined ? parseFloat(minimumLevel) : undefined,
      },
      include: {
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
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

    await db.inventoryItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
