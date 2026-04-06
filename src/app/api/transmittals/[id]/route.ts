import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transmittal = await db.transmittal.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        from: {
          select: { id: true, name: true, email: true },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!transmittal) {
      return NextResponse.json({ error: "Transmittal not found" }, { status: 404 });
    }

    return NextResponse.json(transmittal);
  } catch (error) {
    console.error("Error fetching transmittal:", error);
    return NextResponse.json({ error: "Failed to fetch transmittal" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const transmittal = await db.transmittal.update({
      where: { id },
      data: {
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.toName !== undefined && { toName: body.toName }),
        ...(body.toEmail !== undefined && { toEmail: body.toEmail }),
        ...(body.toCompany !== undefined && { toCompany: body.toCompany }),
        ...(body.toPhone !== undefined && { toPhone: body.toPhone }),
        ...(body.deliveryMethod !== undefined && { deliveryMethod: body.deliveryMethod }),
        ...(body.status !== undefined && { status: body.status }),
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

    return NextResponse.json(transmittal);
  } catch (error) {
    console.error("Error updating transmittal:", error);
    return NextResponse.json({ error: "Failed to update transmittal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.transmittal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transmittal:", error);
    return NextResponse.json({ error: "Failed to delete transmittal" }, { status: 500 });
  }
}
