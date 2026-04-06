import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify task exists
    const task = await db.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comments = await db.taskComment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching task comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await db.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create the comment
    const comment = await db.taskComment.create({
      data: {
        content: content.trim(),
        taskId: id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    // Parse @mentions from content and create notifications
    const mentionRegex = /@(\S+)/g;
    let match: RegExpExecArray | null;
    const mentionedNames: string[] = [];

    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedNames.push(match[1].toLowerCase());
    }

    // Find users by name (case-insensitive)
    if (mentionedNames.length > 0) {
      const allUsers = await db.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      for (const mentionedName of mentionedNames) {
        const targetUser = allUsers.find(
          (u) => u.name.toLowerCase().replace(/\s+/g, ".").includes(mentionedName) ||
                 u.name.toLowerCase().includes(mentionedName.replace(/\./g, " "))
        );

        if (targetUser && targetUser.id !== session.user.id) {
          await db.notification.create({
            data: {
              userId: targetUser.id,
              type: "comment_mention",
              title: session.user.name
                ? `@${session.user.name} ذكرك في مهمة`
                : "Someone mentioned you in a task",
              message: `"${content.trim().slice(0, 100)}${content.trim().length > 100 ? "..." : ""}"`,
              isRead: false,
              relatedEntityType: "task",
              relatedEntityId: id,
            },
          });
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating task comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
