import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const risks = await db.risk.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(risks);
  } catch (error) {
    console.error("Error fetching risks:", error);
    return NextResponse.json({ error: "Failed to fetch risks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      title,
      category,
      probability,
      impact,
      mitigationPlan,
      strategy,
      status,
      assigneeId,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Project ID and title are required" },
        { status: 400 }
      );
    }

    const prob = Number(probability) || 3;
    const imp = Number(impact) || 3;

    // Prepare action items for creation
    const actionsData = (body.actions || []).map(
      (action: { description: string; assigneeId: string; dueDate: string }) => ({
        description: action.description || "",
        assigneeId: action.assigneeId || null,
        dueDate: action.dueDate ? new Date(action.dueDate) : null,
        completed: false,
      })
    );

    // If assigneeId is provided directly, add as first action
    if (assigneeId && actionsData.length === 0) {
      actionsData.push({
        description: title || "",
        assigneeId,
        dueDate: null,
        completed: false,
      });
    }

    const risk = await db.risk.create({
      data: {
        projectId,
        title: title || "",
        category: category || "technical",
        probability: prob,
        impact: imp,
        score: prob * imp,
        mitigationPlan: mitigationPlan || "",
        strategy: strategy || "mitigate",
        status: status || "open",
        actions: {
          create: actionsData,
        },
      },
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

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error("Error creating risk:", error);
    return NextResponse.json({ error: "Failed to create risk" }, { status: 500 });
  }
}
