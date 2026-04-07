import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tender = await db.tender.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, phone: true },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!tender) {
      return NextResponse.json(
        { error: "Tender not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tender);
  } catch (error) {
    console.error("Error fetching tender:", error);
    return NextResponse.json(
      { error: "Failed to fetch tender" },
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

    const existing = await db.tender.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Tender not found" },
        { status: 404 }
      );
    }

    const {
      tenderNumber,
      title,
      authority,
      projectType,
      description,
      estimatedBudget,
      currency,
      closingDate,
      submissionDate,
      qualifications,
      requiredDocs,
      status,
      winnerName,
      lostReason,
      competitorAnalysis,
      notes,
      source,
      sourceUrl,
      assignedTo,
    } = body;

    const tender = await db.tender.update({
      where: { id },
      data: {
        ...(tenderNumber !== undefined && { tenderNumber }),
        ...(title !== undefined && { title }),
        ...(authority !== undefined && { authority }),
        ...(projectType !== undefined && { projectType }),
        ...(description !== undefined && { description }),
        ...(estimatedBudget !== undefined && {
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : 0,
        }),
        ...(currency !== undefined && { currency }),
        ...(closingDate !== undefined && {
          closingDate: closingDate ? new Date(closingDate) : null,
        }),
        ...(submissionDate !== undefined && {
          submissionDate: submissionDate ? new Date(submissionDate) : null,
        }),
        ...(qualifications !== undefined && { qualifications }),
        ...(requiredDocs !== undefined && { requiredDocs }),
        ...(status !== undefined && { status }),
        ...(winnerName !== undefined && { winnerName }),
        ...(lostReason !== undefined && { lostReason }),
        ...(competitorAnalysis !== undefined && { competitorAnalysis }),
        ...(notes !== undefined && { notes }),
        ...(source !== undefined && { source }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(assignedTo !== undefined && {
          assignedTo: assignedTo || null,
        }),
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json(tender);
  } catch (error) {
    console.error("Error updating tender:", error);
    return NextResponse.json(
      { error: "Failed to update tender" },
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

    const existing = await db.tender.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Tender not found" },
        { status: 404 }
      );
    }

    await db.tender.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tender:", error);
    return NextResponse.json(
      { error: "Failed to delete tender" },
      { status: 500 }
    );
  }
}
