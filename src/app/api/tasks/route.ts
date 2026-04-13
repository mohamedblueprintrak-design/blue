import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeObject } from '@/lib/security/sanitize';
import { taskSchema } from '@/lib/validation-schemas';

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
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Zod validation for task fields
    const validation = taskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const validatedData = validation.data;

    // progress is not part of the schema but may be passed
    const { progress } = body as Record<string, unknown>;

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
    } = validatedData;

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
        progress: typeof progress === 'number' ? progress : (parseInt(String(progress)) || 0),
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
