import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contractor = await db.contractor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bids: true,
            evaluations: true,
          },
        },
        bids: {
          select: {
            id: true,
            projectId: true,
            amount: true,
            status: true,
            technicalScore: true,
            financialScore: true,
            totalScore: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                number: true,
                name: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        evaluations: {
          select: {
            id: true,
            projectId: true,
            criteria: true,
            score: true,
            maxScore: true,
            weight: true,
            notes: true,
            evaluatedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    // Calculate average evaluation score
    const allEvaluations = await db.contractorEvaluation.findMany({
      where: { contractorId: id },
    });

    let avgEvaluationScore: number | null = null;
    if (allEvaluations.length > 0) {
      const weightedSum = allEvaluations.reduce(
        (sum, ev) => sum + (ev.score / ev.maxScore) * ev.weight,
        0
      );
      const totalWeight = allEvaluations.reduce(
        (sum, ev) => sum + ev.weight,
        0
      );
      avgEvaluationScore =
        totalWeight > 0
          ? Math.round((weightedSum / totalWeight) * 100 * 100) / 100
          : 0;
    }

    return NextResponse.json({
      ...contractor,
      avgEvaluationScore,
    });
  } catch (error) {
    console.error("Error fetching contractor:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractor" },
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

    const existing = await db.contractor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

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

    const contractor = await db.contractor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(companyName !== undefined && { companyName }),
        ...(companyEn !== undefined && { companyEn }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(crNumber !== undefined && { crNumber }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(licenseExpiry !== undefined && {
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        }),
        ...(category !== undefined && { category }),
        ...(rating !== undefined && { rating: parseInt(String(rating), 10) }),
        ...(specialties !== undefined && { specialties }),
        ...(experience !== undefined && { experience }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccount !== undefined && { bankAccount }),
        ...(iban !== undefined && { iban }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json(contractor);
  } catch (error) {
    console.error("Error updating contractor:", error);
    return NextResponse.json(
      { error: "Failed to update contractor" },
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

    const existing = await db.contractor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    await db.contractor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contractor:", error);
    return NextResponse.json(
      { error: "Failed to delete contractor" },
      { status: 500 }
    );
  }
}
