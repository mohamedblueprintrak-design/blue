import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const budget = await db.budget.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        parent: { select: { id: true, name: true } },
        children: {
          include: {
            project: { select: { id: true, name: true, nameEn: true, number: true } },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, planned, actual, committed, remaining, deviation } = body;

    const existing = await db.budget.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const plannedVal = planned !== undefined ? parseFloat(String(planned)) : existing.planned;
    const actualVal = actual !== undefined ? parseFloat(String(actual)) : existing.actual;
    const committedVal = committed !== undefined ? parseFloat(String(committed)) : existing.committed;
    const remainingVal = remaining !== undefined ? parseFloat(String(remaining)) : plannedVal - actualVal - committedVal;
    const deviationVal = deviation !== undefined ? parseFloat(String(deviation)) : (plannedVal > 0 ? ((actualVal - plannedVal) / plannedVal) * 100 : 0);

    const budget = await db.budget.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        planned: plannedVal,
        actual: actualVal,
        committed: committedVal,
        remaining: remainingVal,
        deviation: deviationVal,
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        children: {
          include: {
            project: { select: { id: true, name: true, nameEn: true, number: true } },
          },
        },
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Delete children first
    const children = await db.budget.findMany({ where: { parentId: id } });
    for (const child of children) {
      await db.budget.delete({ where: { id: child.id } });
    }
    await db.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
