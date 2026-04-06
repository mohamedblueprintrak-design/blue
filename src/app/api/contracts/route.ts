import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const contracts = await db.contract.findMany({
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        _count: {
          select: { amendments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      number,
      title,
      clientId,
      projectId,
      value,
      type,
      status,
      startDate,
      endDate,
    } = body;

    if (!title || !clientId || !projectId) {
      return NextResponse.json(
        { error: "Title, client, and project are required" },
        { status: 400 }
      );
    }

    const contract = await db.contract.create({
      data: {
        number: number || "",
        title,
        clientId,
        projectId,
        value: value ? parseFloat(value) : 0,
        type: type || "engineering_services",
        status: status || "draft",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        _count: {
          select: { amendments: true },
        },
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}
