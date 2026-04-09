import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = await db.meeting.findUnique({
      where: { id },
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

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.time !== undefined) updateData.time = body.time;
    if (body.duration !== undefined) updateData.duration = Number(body.duration);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;

    // Handle attendee updates
    if (body.attendeeIds !== undefined) {
      await db.meetingAttendee.deleteMany({ where: { meetingId: id } });
      updateData.attendees = {
        create: body.attendeeIds.map((userId: string) => ({
          userId,
          role: "attendee",
        })),
      };
    }

    // Handle agenda updates
    if (body.agendaItems !== undefined) {
      await db.meetingAgenda.deleteMany({ where: { meetingId: id } });
      updateData.agenda = {
        create: body.agendaItems.map((item: { topic: string; duration: number }) => ({
          topic: item.topic || "",
          duration: Number(item.duration) || 15,
        })),
      };
    }

    const meeting = await db.meeting.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 });
  }
}
