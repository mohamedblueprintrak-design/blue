import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const orders = await db.purchaseOrder.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        supplier: {
          select: { id: true, name: true, category: true },
        },
        project: {
          select: { id: true, number: true, name: true, nameEn: true },
        },
        items: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
    const pendingApproval = orders.filter((o) => o.status === "submitted").length;

    return NextResponse.json({
      orders,
      summary: { totalOrders, totalAmount, pendingApproval },
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, supplierId, projectId, items, amount, status } = body;

    if (!number || !supplierId) {
      return NextResponse.json(
        { error: "Number and supplier are required" },
        { status: 400 }
      );
    }

    const order = await db.purchaseOrder.create({
      data: {
        number,
        supplierId,
        projectId: projectId || null,
        amount: amount ? parseFloat(amount) : 0,
        status: status || "draft",
        items: items && items.length > 0
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

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
