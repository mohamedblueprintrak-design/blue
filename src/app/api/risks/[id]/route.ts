import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const risk = await db.risk.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        actions: {
          include: {
            assignee: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!risk) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    return NextResponse.json(risk);
  } catch (error) {
    console.error("Error fetching risk:", error);
    return NextResponse.json({ error: "Failed to fetch risk" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.probability !== undefined) updateData.probability = Number(body.probability);
    if (body.impact !== undefined) updateData.impact = Number(body.impact);
    if (body.mitigationPlan !== undefined) updateData.mitigationPlan = body.mitigationPlan;
    if (body.strategy !== undefined) updateData.strategy = body.strategy;
    if (body.status !== undefined) updateData.status = body.status;

    // Auto-calculate score
    if (body.probability !== undefined || body.impact !== undefined) {
      const existing = await db.risk.findUnique({ where: { id }, select: { probability: true, impact: true } });
      if (existing) {
        const p = body.probability !== undefined ? Number(body.probability) : existing.probability;
        const i = body.impact !== undefined ? Number(body.impact) : existing.impact;
        updateData.score = p * i;
      }
    }

    const risk = await db.risk.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        actions: {
          include: {
            assignee: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error("Error updating risk:", error);
    return NextResponse.json({ error: "Failed to update risk" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.risk.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting risk:", error);
    return NextResponse.json({ error: "Failed to delete risk" }, { status: 500 });
  }
}
