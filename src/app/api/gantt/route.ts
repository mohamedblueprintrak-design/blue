/**
 * Gantt Chart API
 * Uses existing Task and SchedulePhase models
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch tasks and schedule phases for Gantt chart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const taskWhere = projectId ? { projectId } : {};

    // Fetch tasks
    const tasks = await db.task.findMany({
      where: taskWhere,
      orderBy: [{ startDate: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        projectId: true,
        priority: true,
        status: true,
        startDate: true,
        endDate: true as any,
        dueDate: true,
        progress: true,
        isGovernmental: true,
      } as any,
    });

    // Fetch schedule phases
    const phases = await db.schedulePhase.findMany({
      where: projectId ? { projectId } : {},
      orderBy: [{ phaseOrder: "asc" }],
      select: {
        id: true,
        projectId: true,
        section: true,
        phaseOrder: true,
        phaseName: true,
        duration: true,
        maxDuration: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    // Combine both into a unified gantt data format
    const ganttTasks = [
      ...tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        projectId: task.projectId,
        priority: task.priority,
        status: task.status,
        startDate: task.startDate,
        endDate: (task as any).endDate,
        dueDate: task.dueDate,
        progress: task.progress,
        isMilestone: false,
        isGovernmental: task.isGovernmental,
        type: "task" as const,
        phaseCategory: getPhaseCategoryFromTask(task as any),
      })),
      ...phases.map((phase) => ({
        id: `phase-${phase.id}`,
        title: phase.phaseName,
        description: undefined,
        projectId: phase.projectId,
        priority: "medium" as const,
        status: mapPhaseStatus(phase.status),
        startDate: phase.startDate,
        endDate: phase.endDate,
        dueDate: undefined,
        progress: phase.status === "COMPLETED" ? 100 : phase.status === "IN_PROGRESS" ? 50 : 0,
        isMilestone: false,
        isGovernmental: phase.section === "governmental",
        type: "phase" as const,
        phaseCategory: mapSectionToCategory(phase.section),
      })),
    ];

    return NextResponse.json({
      success: true,
      data: ganttTasks,
    });
  } catch (error) {
    console.error("Error fetching Gantt data:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch Gantt data" } },
      { status: 500 }
    );
  }
}

// POST - Create new task (for Gantt add)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: { message: "Title is required" } },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description || "",
        projectId: body.projectId || null,
        priority: body.priority || "normal",
        status: body.status || "todo",
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        progress: body.progress || 0,
        isGovernmental: body.isGovernmental || false,
      } as any,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Error creating Gantt task:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create task" } },
      { status: 500 }
    );
  }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Task ID is required" } },
        { status: 400 }
      );
    }

    // Handle phase updates (id starts with "phase-")
    if (id.startsWith("phase-")) {
      const phaseId = id.replace("phase-", "");
      const updateData: Record<string, unknown> = {};
      if (data.status !== undefined) updateData.status = mapStatusToPhaseStatus(data.status);
      if (data.progress !== undefined) {
        if (data.progress >= 100) updateData.status = "COMPLETED";
        else if (data.progress > 0) updateData.status = "IN_PROGRESS";
      }
      if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

      const phase = await db.schedulePhase.update({
        where: { id: phaseId },
        data: updateData,
      });
      return NextResponse.json({ success: true, data: phase });
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.isGovernmental !== undefined) updateData.isGovernmental = data.isGovernmental;

    const task = await db.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Error updating Gantt task:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update task" } },
      { status: 500 }
    );
  }
}

// DELETE - Delete task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Task ID is required" } },
        { status: 400 }
      );
    }

    if (id.startsWith("phase-")) {
      const phaseId = id.replace("phase-", "");
      await db.schedulePhase.delete({ where: { id: phaseId } });
    } else {
      await db.task.delete({ where: { id } });
    }

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Gantt task:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete task" } },
      { status: 500 }
    );
  }
}

// ===== Helper functions =====

function getPhaseCategoryFromTask(task: {
  isGovernmental: boolean | null;
  description: string | null;
}): string {
  if (task.isGovernmental) return "GOVERNMENT";
  const desc = (task.description || "").toLowerCase();
  if (desc.includes("structural") || desc.includes("إنشائ")) return "STRUCTURAL";
  if (desc.includes("mep") || desc.includes("electrical") || desc.includes("كهرباء")) return "MEP";
  return "ARCHITECTURAL";
}

function mapSectionToCategory(section: string): string {
  const map: Record<string, string> = {
    architectural: "ARCHITECTURAL",
    structural: "STRUCTURAL",
    electrical: "MEP",
    governmental: "GOVERNMENT",
    contracting: "CONTRACTING",
  };
  return map[section] || "ARCHITECTURAL";
}

function mapPhaseStatus(phaseStatus: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: "todo",
    IN_PROGRESS: "in_progress",
    SUBMITTED: "review",
    APPROVED: "done",
    REJECTED: "cancelled",
  };
  return map[phaseStatus] || "todo";
}

function mapStatusToPhaseStatus(status: string): string {
  const map: Record<string, string> = {
    todo: "NOT_STARTED",
    in_progress: "IN_PROGRESS",
    review: "SUBMITTED",
    done: "APPROVED",
    cancelled: "REJECTED",
  };
  return map[status] || "NOT_STARTED";
}
