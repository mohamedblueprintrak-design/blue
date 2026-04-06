import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (category && category !== "all") where.category = category;

    const documents = await db.document.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        contract: { select: { id: true, number: true, title: true } },
        uploader: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      contractId,
      name,
      fileType,
      fileSize,
      category,
      version,
      uploadedById,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Document name is required" }, { status: 400 });
    }

    const document = await db.document.create({
      data: {
        projectId: projectId || null,
        contractId: contractId || null,
        name: name || "",
        fileType: fileType || "",
        fileSize: fileSize || 0,
        category: category || "general",
        version: version || 1,
        uploadedById: uploadedById || null,
        filePath: "",
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        contract: { select: { id: true, number: true, title: true } },
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
