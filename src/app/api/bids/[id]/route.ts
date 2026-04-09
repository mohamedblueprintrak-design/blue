import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bid = await db.bid.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        contractor: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            companyName: true,
            companyEn: true,
            contactPerson: true,
            phone: true,
            email: true,
            category: true,
            rating: true,
            crNumber: true,
            licenseNumber: true,
            specialties: true,
            address: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            criteria: true,
            score: true,
            maxScore: true,
            weight: true,
            notes: true,
            evaluatedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    return NextResponse.json(bid);
  } catch (error) {
    console.error("Error fetching bid:", error);
    return NextResponse.json({ error: "Failed to fetch bid" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      contractorName,
      contractorContact,
      amount,
      technicalScore,
      financialScore,
      totalScore,
      deadline,
      notes,
      evaluationNotes,
      status,
    } = body;

    const existing = await db.bid.findUnique({
      where: { id },
      include: { contractor: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    // When status changes to accepted/rejected and contractorId exists, auto-fill name
    let resolvedContractorName = contractorName;
    if (
      (status === "accepted" || status === "rejected") &&
      resolvedContractorName === undefined &&
      existing.contractorId &&
      existing.contractor
    ) {
      resolvedContractorName =
        existing.contractor.companyName || existing.contractor.name;
    }

    const bid = await db.bid.update({
      where: { id },
      data: {
        ...(contractorName !== undefined && { contractorName }),
        ...(resolvedContractorName !== undefined && {
          contractorName: resolvedContractorName,
        }),
        ...(contractorContact !== undefined && { contractorContact }),
        ...(amount !== undefined && {
          amount: parseFloat(String(amount)),
        }),
        ...(technicalScore !== undefined && {
          technicalScore: parseInt(String(technicalScore), 10),
        }),
        ...(financialScore !== undefined && {
          financialScore: parseInt(String(financialScore), 10),
        }),
        ...(totalScore !== undefined && {
          totalScore: parseFloat(String(totalScore)),
        }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(notes !== undefined && { notes }),
        ...(evaluationNotes !== undefined && { evaluationNotes }),
        ...(status !== undefined && { status }),
      },
      include: {
        project: { select: { id: true, name: true, nameEn: true, number: true } },
        contractor: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            companyName: true,
            companyEn: true,
            contactPerson: true,
            phone: true,
            email: true,
            category: true,
            rating: true,
          },
        },
      },
    });

    return NextResponse.json(bid);
  } catch (error) {
    console.error("Error updating bid:", error);
    return NextResponse.json({ error: "Failed to update bid" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.bid.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bid:", error);
    return NextResponse.json({ error: "Failed to delete bid" }, { status: 500 });
  }
}
