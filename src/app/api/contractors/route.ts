import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { companyName: { contains: search } },
        { companyEn: { contains: search } },
        { contactPerson: { contains: search } },
        { crNumber: { contains: search } },
        { licenseNumber: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // If projectId is provided, only return contractors who have bids on that project
    if (projectId) {
      where.bids = {
        some: { projectId },
      };
    }

    const contractors = await db.contractor.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        _count: {
          select: {
            bids: true,
            evaluations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contractors);
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      nameEn,
      companyName,
      companyEn,
      contactPerson,
      phone,
      email,
      address,
      crNumber,
      licenseNumber,
      licenseExpiry,
      category,
      rating,
      specialties,
      experience,
      bankName,
      bankAccount,
      iban,
      isActive,
      notes,
    } = body;

    if (!name && !companyName) {
      return NextResponse.json(
        { error: "Contractor name or company name is required" },
        { status: 400 }
      );
    }

    const contractor = await db.contractor.create({
      data: {
        name: name || "",
        nameEn: nameEn || "",
        companyName: companyName || "",
        companyEn: companyEn || "",
        contactPerson: contactPerson || "",
        phone: phone || "",
        email: email || "",
        address: address || "",
        crNumber: crNumber || "",
        licenseNumber: licenseNumber || "",
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        category: category || "",
        rating: rating !== undefined ? parseInt(String(rating), 10) : 0,
        specialties: specialties || "",
        experience: experience || "",
        bankName: bankName || "",
        bankAccount: bankAccount || "",
        iban: iban || "",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        notes: notes || "",
      },
      include: {
        _count: {
          select: {
            bids: true,
            evaluations: true,
          },
        },
      },
    });

    return NextResponse.json(contractor, { status: 201 });
  } catch (error) {
    console.error("Error creating contractor:", error);
    return NextResponse.json(
      { error: "Failed to create contractor" },
      { status: 500 }
    );
  }
}
