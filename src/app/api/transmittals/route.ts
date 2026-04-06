import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const transmittals = await db.transmittal.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transmittals);
  } catch (error) {
    console.error("Error fetching transmittals:", error);
    return NextResponse.json({ error: "Failed to fetch transmittals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      subject,
      fromId,
      toName,
      toEmail,
      toCompany,
      toPhone,
      deliveryMethod,
      status,
    } = body;

    if (!projectId || !subject || !fromId) {
      return NextResponse.json(
        { error: "Project ID, subject, and from ID are required" },
        { status: 400 }
      );
    }

    // Generate transmittal number
    const count = await db.transmittal.count();
    const number = `TR-${String(count + 1).padStart(4, "0")}`;

    // Prepare items for creation
    const itemsData = (body.items || []).map(
      (item: { documentNumber: string; title: string; revision: string; copies: number; purpose: string }) => ({
        documentNumber: item.documentNumber || "",
        title: item.title || "",
        revision: item.revision || "",
        copies: Number(item.copies) || 1,
        purpose: item.purpose || "review",
      })
    );

    const transmittal = await db.transmittal.create({
      data: {
        number,
        projectId,
        subject: subject || "",
        fromId,
        toName: toName || "",
        toEmail: toEmail || "",
        toCompany: toCompany || "",
        toPhone: toPhone || "",
        deliveryMethod: deliveryMethod || "email",
        status: status || "sent",
        items: {
          create: itemsData,
        },
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });

    return NextResponse.json(transmittal, { status: 201 });
  } catch (error) {
    console.error("Error creating transmittal:", error);
    return NextResponse.json({ error: "Failed to create transmittal" }, { status: 500 });
  }
}
