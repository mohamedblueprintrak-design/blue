import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/tasks/[id]/comments/[commentId] - Delete a task comment
 *
 * Uses JWT-based auth via x-user-id and x-user-role headers (set by middleware from blue_token cookie).
 * Do NOT use getServerSession() — the custom JWT login flow never creates a NextAuth session.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;

    // Use JWT-based auth via headers set by middleware
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify comment exists and belongs to the task
    const comment = await db.taskComment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.taskId !== id) {
      return NextResponse.json({ error: "Comment does not belong to this task" }, { status: 400 });
    }

    // Check authorization: only comment author or admin can delete
    const isAdmin = comment.user.role === "admin" || userRole === "admin";
    const isAuthor = comment.userId === userId;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.taskComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
