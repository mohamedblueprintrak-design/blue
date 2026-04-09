import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        contract: { select: { id: true, number: true, title: true } },
        uploader: { select: { id: true, name: true, avatar: true, email: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const document = await db.document.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.fileType !== undefined && { fileType: body.fileType }),
        ...(body.fileSize !== undefined && { fileSize: body.fileSize }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.version !== undefined && { version: body.version }),
        ...(body.projectId !== undefined && { projectId: body.projectId || null }),
        ...(body.contractId !== undefined && { contractId: body.contractId || null }),
        ...(body.uploadedById !== undefined && { uploadedById: body.uploadedById || null }),
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        contract: { select: { id: true, number: true, title: true } },
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
