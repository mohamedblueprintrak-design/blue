import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interactions = await db.clientInteraction.findMany({
      where: { projectId: id },
      orderBy: { date: "desc" },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
    });

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error("Error fetching interactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interactions" },
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
    const { clientId, type, date, subject, description, outcome } = body;

    if (!clientId || !date) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, date" },
        { status: 400 }
      );
    }

    const interaction = await db.clientInteraction.create({
      data: {
        projectId: id,
        clientId,
        type: type || "meeting",
        date: new Date(date),
        subject: subject || "",
        description: description || "",
        outcome: outcome || "",
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error("Error creating interaction:", error);
    return NextResponse.json(
      { error: "Failed to create interaction" },
      { status: 500 }
    );
  }
}
