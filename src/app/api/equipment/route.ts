import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const equipment = await db.equipment.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const totalEquipment = equipment.length;
    const availableCount = equipment.filter((e) => e.status === "available").length;
    const inUseCount = equipment.filter((e) => e.status === "in_use").length;
    const maintenanceCount = equipment.filter((e) => e.status === "maintenance").length;

    return NextResponse.json({
      equipment,
      summary: { totalEquipment, availableCount, inUseCount, maintenanceCount },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const equip = await db.equipment.create({
      data: {
        name,
        type: type || "",
        model: model || "",
        serialNumber: serialNumber || "",
        status: status || "available",
        location: location || "",
        dailyRate: dailyRate ? parseFloat(dailyRate) : 0,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
      },
    });

    return NextResponse.json(equip, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    );
  }
}
