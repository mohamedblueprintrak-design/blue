import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const rfis = await db.rFI.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        to: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rfis);
  } catch (error) {
    console.error("Error fetching RFIs:", error);
    return NextResponse.json({ error: "Failed to fetch RFIs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, number, subject, description, fromId, toId, priority, dueDate } = body;

    if (!projectId || !subject || !fromId || !toId) {
      return NextResponse.json({ error: "Project ID, subject, from, and to are required" }, { status: 400 });
    }

    const rfi = await db.rFI.create({
      data: {
        projectId,
        number: number || "",
        subject,
        description: description || "",
        fromId,
        toId,
        priority: priority || "normal",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        to: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(rfi, { status: 201 });
  } catch (error) {
    console.error("Error creating RFI:", error);
    return NextResponse.json({ error: "Failed to create RFI" }, { status: 500 });
  }
}
