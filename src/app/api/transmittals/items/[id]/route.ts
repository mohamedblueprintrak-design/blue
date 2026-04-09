import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const item = await db.transmittalItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Transmittal item not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.received !== undefined) updateData.received = Boolean(body.received);
    if (body.approved !== undefined) updateData.approved = Boolean(body.approved);
    if (body.rejected !== undefined) updateData.rejected = Boolean(body.rejected);
    if (body.needsRevision !== undefined) updateData.needsRevision = Boolean(body.needsRevision);
    if (body.replyNotes !== undefined) updateData.replyNotes = body.replyNotes;
    if (body.documentNumber !== undefined) updateData.documentNumber = body.documentNumber;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.revision !== undefined) updateData.revision = body.revision;
    if (body.copies !== undefined) updateData.copies = Number(body.copies);
    if (body.purpose !== undefined) updateData.purpose = body.purpose;

    const updated = await db.transmittalItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transmittal item:", error);
    return NextResponse.json({ error: "Failed to update transmittal item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.transmittalItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transmittal item:", error);
    return NextResponse.json({ error: "Failed to delete transmittal item" }, { status: 500 });
  }
}
