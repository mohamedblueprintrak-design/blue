import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stages = await db.projectStage.findMany({
      where: { projectId: id },
      orderBy: [{ department: "asc" }, { stageOrder: "asc" }],
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    const byDepartment: Record<string, typeof stages> = {};
    for (const stage of stages) {
      if (!byDepartment[stage.department]) {
        byDepartment[stage.department] = [];
      }
      byDepartment[stage.department].push(stage);
    }

    return NextResponse.json({ stages, byDepartment });
  } catch (error) {
    console.error("Error fetching stages:", error);
    return NextResponse.json(
      { error: "Failed to fetch stages" },
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
    const { stages } = body as { stages: Array<{ id: string; status: string; notes?: string; engineerId?: string }> };

    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { error: "stages must be an array" },
        { status: 400 }
      );
    }

    const updated = await Promise.all(
      stages.map((stage) =>
        db.projectStage.update({
          where: { id: stage.id },
          data: {
            ...(stage.status && { status: stage.status }),
            ...(stage.notes !== undefined && { notes: stage.notes }),
            ...(stage.engineerId && { engineerId: stage.engineerId }),
          },
        })
      )
    );

    // Recalculate project progress based on all stages
    const allStages = await db.projectStage.findMany({
      where: { projectId: id },
    });
    const completed = allStages.filter(
      (s) => s.status === "APPROVED"
    ).length;
    const total = allStages.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await db.project.update({
      where: { id },
      data: { progress },
    });

    return NextResponse.json({ stages: updated, progress });
  } catch (error) {
    console.error("Error updating stages:", error);
    return NextResponse.json(
      { error: "Failed to update stages" },
      { status: 500 }
    );
  }
}
