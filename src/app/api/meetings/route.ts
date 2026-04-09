import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const meetings = await db.meeting.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        agenda: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      title,
      date,
      time,
      duration,
      location,
      type,
      notes,
      attendeeIds,
      agendaItems,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    const meeting = await db.meeting.create({
      data: {
        projectId: projectId || null,
        title: title || "",
        date: new Date(date),
        time: time || "",
        duration: Number(duration) || 60,
        location: location || "",
        type: type || "onsite",
        notes: notes || "",
        attendees: {
          create: (attendeeIds || []).map((userId: string) => ({
            userId,
            role: "attendee",
          })),
        },
        agenda: {
          create: (agendaItems || []).map((item: { topic: string; duration: number }) => ({
            topic: item.topic || "",
            duration: Number(item.duration) || 15,
          })),
        },
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        agenda: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}
