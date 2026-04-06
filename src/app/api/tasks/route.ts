import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {
      parentId: null, // Only top-level tasks
    };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        subtasks: {
          select: { id: true, status: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate subtask completion for each task
    const tasksWithSubtaskCount = tasks.map((task) => {
      const totalSubtasks = task.subtasks.length;
      const completedSubtasks = task.subtasks.filter(
        (s) => s.status === "done"
      ).length;
      return {
        ...task,
        commentCount: task._count.comments,
        _count: {
          subtasks: totalSubtasks,
          completedSubtasks,
        },
      };
    });

    return NextResponse.json(tasksWithSubtaskCount);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      status,
      startDate,
      dueDate,
      isGovernmental,
      slaDays,
      progress,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || "",
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        priority: priority || "normal",
        status: status || "todo",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        isGovernmental: isGovernmental || false,
        slaDays: slaDays ? parseInt(slaDays) : null,
        progress: progress || 0,
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        subtasks: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
