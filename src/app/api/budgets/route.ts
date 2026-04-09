import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const budgets = await db.budget.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        children: {
          include: {
            project: { select: { id: true, name: true, nameEn: true, number: true } },
          },
        },
      },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });

    // Return only top-level budgets (those without a parent)
    const topLevel = budgets.filter((b) => !b.parentId);

    return NextResponse.json(topLevel);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, parentId, name, category, planned, actual, committed } = body;

    if (!projectId || !name || !category) {
      return NextResponse.json({ error: "Project, name, and category are required" }, { status: 400 });
    }

    const plannedVal = planned ? parseFloat(String(planned)) : 0;
    const actualVal = actual ? parseFloat(String(actual)) : 0;
    const committedVal = committed ? parseFloat(String(committed)) : 0;
    const remainingVal = plannedVal - actualVal - committedVal;
    const deviationVal = plannedVal > 0 ? ((actualVal - plannedVal) / plannedVal) * 100 : 0;

    const budget = await db.budget.create({
      data: {
        projectId,
        parentId: parentId || null,
        name,
        category,
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

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
