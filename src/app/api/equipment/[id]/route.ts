import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const equip = await db.equipment.findUnique({
      where: { id },
    });

    if (!equip) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(equip);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
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
    const {
      name,
      type,
      model,
      serialNumber,
      status,
      location,
      dailyRate,
      lastMaintenance,
      nextMaintenance,
    } = body;

    const equip = await db.equipment.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type : undefined,
        model: model !== undefined ? model : undefined,
        serialNumber: serialNumber !== undefined ? serialNumber : undefined,
        status: status !== undefined ? status : undefined,
        location: location !== undefined ? location : undefined,
        dailyRate: dailyRate !== undefined ? parseFloat(dailyRate) : undefined,
        lastMaintenance: lastMaintenance !== undefined
          ? (lastMaintenance ? new Date(lastMaintenance) : null)
          : undefined,
        nextMaintenance: nextMaintenance !== undefined
          ? (nextMaintenance ? new Date(nextMaintenance) : null)
          : undefined,
      },
    });

    return NextResponse.json(equip);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Failed to update equipment" },
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

    await db.equipment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    );
  }
}
