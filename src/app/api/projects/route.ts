import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeObject } from '@/lib/security/sanitize';
import { projectSchema } from '@/lib/validation-schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { number: { contains: search } },
        { location: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, company: true },
          },
          contractor: {
            select: { id: true, name: true, companyName: true, category: true },
          },
          assignments: {
            select: { userId: true, role: true },
          },
          _count: {
            select: { tasks: true, stages: true, invoices: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Zod validation for project fields
    const validation = projectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const validatedData = validation.data;

    // createdById is not part of the schema but still required
    const { createdById, latitude, longitude } = body as Record<string, unknown>;
    if (!createdById) {
      return NextResponse.json(
        { error: "createdById is required" },
        { status: 400 }
      );
    }

    const {
      number,
      name,
      nameEn,
      clientId,
      contractorId,
      location,
      plotNumber,
      type,
      budget,
      startDate,
      endDate,
      description,
    } = validatedData;

    const project = await db.project.create({
      data: {
        number,
        name,
        nameEn: nameEn || "",
        clientId,
        contractorId: contractorId || null,
        location: location || "",
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        plotNumber: plotNumber || "",
        type: type || "villa",
        budget: typeof budget === 'string' ? parseFloat(budget) : (budget || 0),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || "",
        createdById: createdById as string,
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        contractor: {
          select: { id: true, name: true, companyName: true, category: true },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
