import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const counts = await db.taskComment.groupBy({
      by: ["taskId"],
      _count: true,
      orderBy: { _count: { id: "desc" } },
    });

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error fetching comment counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch comment counts" },
      { status: 500 }
    );
  }
}
