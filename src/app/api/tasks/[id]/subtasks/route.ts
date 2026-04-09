import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subtasks = await db.task.findMany({
      where: { parentId: id },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, assigneeId, priority } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check parent task exists
    const parent = await db.task.findUnique({ where: { id } });
    if (!parent) {
      return NextResponse.json({ error: "Parent task not found" }, { status: 404 });
    }

    const subtask = await db.task.create({
      data: {
        title,
        description: description || "",
        assigneeId: assigneeId || parent.assigneeId || null,
        priority: priority || parent.priority || "normal",
        status: "todo",
        parentId: id,
        projectId: parent.projectId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
