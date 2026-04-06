/**
 * BOQ (Bill of Quantities) API - Standalone CRUD
 * جدول الكميات - واجهة برمجة التطبيقات
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch BOQ items (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;

    const items = await db.bOQItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { code: "asc" }],
      select: {
        id: true,
        projectId: true,
        code: true,
        description: true,
        unit: true,
        quantity: true,
        unitPrice: true,
        total: true,
        category: true,
      },
    });

    // Calculate summary
    const summary = {
      total: items.reduce((sum, item) => sum + item.total, 0),
      itemCount: items.length,
      byCategory: {} as Record<string, { count: number; total: number }>,
    };

    for (const item of items) {
      if (!summary.byCategory[item.category]) {
        summary.byCategory[item.category] = { count: 0, total: 0 };
      }
      summary.byCategory[item.category].count += 1;
      summary.byCategory[item.category].total += item.total;
    }

    return NextResponse.json({ success: true, data: items, summary });
  } catch (error) {
    console.error("Error fetching BOQ items:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch BOQ items" } },
      { status: 500 }
    );
  }
}

// POST - Create new BOQ item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, code, description, unit, quantity, unitPrice, category } = body;

    if (!projectId || !description || !unit || quantity === undefined || unitPrice === undefined) {
      return NextResponse.json(
        { success: false, error: { message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const total = quantity * unitPrice;

    const item = await db.bOQItem.create({
      data: {
        projectId,
        code: code || "",
        description,
        unit,
        quantity,
        unitPrice,
        total,
        category: category || "civil",
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Error creating BOQ item:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create BOQ item" } },
      { status: 500 }
    );
  }
}

// PUT - Update BOQ item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Item ID is required" } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.category !== undefined) updateData.category = data.category;

    // Recalculate total if quantity or unitPrice changed
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const existing = await db.bOQItem.findUnique({ where: { id } });
      if (existing) {
        const qty = data.quantity !== undefined ? data.quantity : existing.quantity;
        const price = data.unitPrice !== undefined ? data.unitPrice : existing.unitPrice;
        updateData.total = qty * price;
      }
    }

    const item = await db.bOQItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Error updating BOQ item:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update BOQ item" } },
      { status: 500 }
    );
  }
}

// DELETE - Delete BOQ item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Item ID is required" } },
        { status: 400 }
      );
    }

    await db.bOQItem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "BOQ item deleted successfully" });
  } catch (error) {
    console.error("Error deleting BOQ item:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete BOQ item" } },
      { status: 500 }
    );
  }
}
