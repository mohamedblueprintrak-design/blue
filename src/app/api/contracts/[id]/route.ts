import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true, phone: true },
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            number: true,
            status: true,
            type: true,
          },
        },
        amendments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.contract.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

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

    const contract = await db.contract.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(title !== undefined && { title }),
        ...(clientId !== undefined && { clientId }),
        ...(projectId !== undefined && { projectId }),
        ...(value !== undefined && {
          value: value ? parseFloat(value) : 0,
        }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
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

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.contract.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    await db.contract.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
