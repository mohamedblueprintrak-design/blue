import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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
    const isAdmin = comment.user.role === "admin" || session.user.role === "admin";
    const isAuthor = comment.userId === session.user.id;

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
