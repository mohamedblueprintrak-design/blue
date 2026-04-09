import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const lowStock = searchParams.get("lowStock");

    const where: Record<string, unknown> = {};

    if (projectId) {
      where.projectId = projectId;
    }
    if (lowStock === "true") {
      // Items where quantity is at or below minimum level
      where.quantity = { lte: undefined };
    }

    // Fetch all items and filter low stock in-memory for SQLite compatibility
    const items = await db.inventoryItem.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute total value for each item
    const itemsWithTotal = items.map((item) => ({
      ...item,
      totalValue: item.quantity * item.price,
      isLowStock: item.minimumLevel > 0 && item.quantity <= item.minimumLevel,
    }));

    // Filter low stock if requested
    const result = lowStock === "true"
      ? itemsWithTotal.filter((i) => i.isLowStock)
      : itemsWithTotal;

    // Summary stats
    const totalItems = items.length;
    const lowStockCount = itemsWithTotal.filter((i) => i.isLowStock).length;
    const totalValue = itemsWithTotal.reduce((sum, i) => sum + i.totalValue, 0);

    return NextResponse.json({
      items: result,
      summary: { totalItems, lowStockCount, totalValue },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, projectId, quantity, unit, price, location, minimumLevel } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        projectId: projectId || null,
        quantity: quantity ? parseFloat(quantity) : 0,
        unit: unit || "",
        price: price ? parseFloat(price) : 0,
        location: location || "",
        minimumLevel: minimumLevel ? parseFloat(minimumLevel) : 0,
      },
      include: {
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
