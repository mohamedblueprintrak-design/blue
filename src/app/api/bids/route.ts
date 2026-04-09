import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const bids = await db.bid.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      contractorId,
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

    if (!projectId) {
      return NextResponse.json(
        { error: "Project is required" },
        { status: 400 }
      );
    }

    // If contractorId is provided, auto-fill contractor info
    let resolvedContractorName = contractorName || "";
    let resolvedContractorContact = contractorContact || "";

    if (contractorId) {
      const contractor = await db.contractor.findUnique({
        where: { id: contractorId },
      });
      if (contractor) {
        if (!resolvedContractorName) {
          resolvedContractorName = contractor.companyName || contractor.name;
        }
        if (!resolvedContractorContact) {
          resolvedContractorContact = contractor.phone || contractor.email;
        }
      }
    }

    if (!resolvedContractorName) {
      return NextResponse.json(
        { error: "Contractor name is required" },
        { status: 400 }
      );
    }

    const bid = await db.bid.create({
      data: {
        projectId,
        contractorId: contractorId || null,
        contractorName: resolvedContractorName,
        contractorContact: resolvedContractorContact,
        amount: amount ? parseFloat(String(amount)) : 0,
        technicalScore: technicalScore !== undefined ? parseInt(String(technicalScore), 10) : 0,
        financialScore: financialScore !== undefined ? parseInt(String(financialScore), 10) : 0,
        totalScore: totalScore !== undefined ? parseFloat(String(totalScore)) : 0,
        deadline: deadline ? new Date(deadline) : null,
        notes: notes || "",
        evaluationNotes: evaluationNotes || "",
        status: status || "submitted",
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

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 });
  }
}
