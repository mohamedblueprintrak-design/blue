import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      select: { id: true, name: true, nameEn: true, number: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
