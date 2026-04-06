import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (type) where.type = type;

    const changeOrders = await db.changeOrder.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(changeOrders);
  } catch (error) {
    console.error("Error fetching change orders:", error);
    return NextResponse.json({ error: "Failed to fetch change orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, number, type, costImpact, timeImpact, description, status } = body;

    if (!projectId || !number) {
      return NextResponse.json({ error: "Project ID and number are required" }, { status: 400 });
    }

    const changeOrder = await db.changeOrder.create({
      data: {
        projectId,
        number,
        type: type || "change",
        costImpact: costImpact ? parseFloat(costImpact) : 0,
        timeImpact: timeImpact || "",
        description: description || "",
        status: status || "pending",
      },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
    });

    return NextResponse.json(changeOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating change order:", error);
    return NextResponse.json({ error: "Failed to create change order" }, { status: 500 });
  }
}
