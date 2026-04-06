import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const phases = await db.schedulePhase.findMany({
      where: { projectId: id },
      orderBy: [{ section: "asc" }, { phaseOrder: "asc" }],
    });

    const bySection: Record<string, typeof phases> = {};
    for (const phase of phases) {
      if (!bySection[phase.section]) {
        bySection[phase.section] = [];
      }
      bySection[phase.section].push(phase);
    }

    const summary: Record<string, { totalDays: number; maxDays: number; completedPhases: number; totalPhases: number }> = {};
    for (const [section, sectionPhases] of Object.entries(bySection)) {
      const totalDays = sectionPhases.reduce((sum, p) => sum + p.duration, 0);
      const maxDays = sectionPhases.reduce((sum, p) => sum + p.maxDuration, 0);
      const completedPhases = sectionPhases.filter((p) => p.status === "COMPLETED").length;
      summary[section] = {
        totalDays,
        maxDays,
        completedPhases,
        totalPhases: sectionPhases.length,
      };
    }

    return NextResponse.json({ phases, bySection, summary });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
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
    const { phases } = body as {
      phases: Array<{
        id: string;
        status: string;
        duration?: number;
        startDate?: string;
        endDate?: string;
      }>;
    };

    if (!Array.isArray(phases)) {
      return NextResponse.json(
        { error: "phases must be an array" },
        { status: 400 }
      );
    }

    const updated = await Promise.all(
      phases.map((phase) =>
        db.schedulePhase.update({
          where: { id: phase.id },
          data: {
            ...(phase.status && { status: phase.status }),
            ...(phase.duration !== undefined && { duration: phase.duration }),
            ...(phase.startDate && {
              startDate: new Date(phase.startDate),
            }),
            ...(phase.endDate && {
              endDate: new Date(phase.endDate),
            }),
          },
        })
      )
    );

    return NextResponse.json({ phases: updated });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}
