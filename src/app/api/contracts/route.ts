import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { contractSchema } from '@/lib/validation-schemas';
import { sanitizeObject } from '@/lib/security/sanitize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const contracts = await db.contract.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Zod validation for contract fields
    const validation = contractSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const validatedData = validation.data;
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
    } = validatedData;

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
