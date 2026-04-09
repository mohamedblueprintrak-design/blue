import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const changeOrder = await db.changeOrder.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    if (!changeOrder) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error("Error fetching change order:", error);
    return NextResponse.json({ error: "Failed to fetch change order" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, type, costImpact, timeImpact, description, status } = body;

    const changeOrder = await db.changeOrder.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(type !== undefined && { type }),
        ...(costImpact !== undefined && { costImpact: parseFloat(costImpact) || 0 }),
        ...(timeImpact !== undefined && { timeImpact }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(changeOrder);
  } catch (error) {
    console.error("Error updating change order:", error);
    return NextResponse.json({ error: "Failed to update change order" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.changeOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting change order:", error);
    return NextResponse.json({ error: "Failed to delete change order" }, { status: 500 });
  }
}
