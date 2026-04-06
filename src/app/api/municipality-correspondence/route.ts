/**
 * Municipality Correspondence API
 * المراسلات البلدية - واجهة برمجة التطبيقات
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_TYPES = ["SUBMISSION", "RESPONSE", "REJECTION", "APPROVAL", "INQUIRY", "AMENDMENT"];
const VALID_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "AMENDMENT_REQUIRED"];

// GET - List municipality correspondence records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const municipality = searchParams.get("municipality");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (type && VALID_TYPES.includes(type)) where.correspondenceType = type;
    if (municipality) where.municipality = municipality;

    const records = await db.municipalityCorrespondence.findMany({
      where,
      orderBy: { submissionDate: "desc" },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching municipality correspondence:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch records" } },
      { status: 500 }
    );
  }
}

// POST - Create new correspondence record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, referenceNumber, municipality, correspondenceType, subject, content, submissionDate, responseDate, status, notes, responseNotes } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { message: "projectId is required" } },
        { status: 400 }
      );
    }

    if (correspondenceType && !VALID_TYPES.includes(correspondenceType)) {
      return NextResponse.json(
        { success: false, error: { message: `Invalid type. Must be: ${VALID_TYPES.join(", ")}` } },
        { status: 400 }
      );
    }

    const record = await db.municipalityCorrespondence.create({
      data: {
        projectId,
        referenceNumber: referenceNumber || "",
        municipality: municipality || "",
        correspondenceType: correspondenceType || "SUBMISSION",
        subject: subject || "",
        content: content || "",
        submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
        responseDate: responseDate ? new Date(responseDate) : null,
        status: status && VALID_STATUSES.includes(status) ? status : "PENDING",
        notes: notes || "",
        responseNotes: responseNotes || "",
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating municipality correspondence:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create record" } },
      { status: 500 }
    );
  }
}

// PUT - Update correspondence record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "id is required" } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updateFields.referenceNumber !== undefined) updateData.referenceNumber = updateFields.referenceNumber;
    if (updateFields.municipality !== undefined) updateData.municipality = updateFields.municipality;
    if (updateFields.correspondenceType !== undefined) {
      if (!VALID_TYPES.includes(updateFields.correspondenceType)) {
        return NextResponse.json({ success: false, error: { message: "Invalid correspondence type" } }, { status: 400 });
      }
      updateData.correspondenceType = updateFields.correspondenceType;
    }
    if (updateFields.subject !== undefined) updateData.subject = updateFields.subject;
    if (updateFields.content !== undefined) updateData.content = updateFields.content;
    if (updateFields.submissionDate !== undefined) updateData.submissionDate = updateFields.submissionDate ? new Date(updateFields.submissionDate) : null;
    if (updateFields.responseDate !== undefined) updateData.responseDate = updateFields.responseDate ? new Date(updateFields.responseDate) : null;
    if (updateFields.status !== undefined) {
      if (!VALID_STATUSES.includes(updateFields.status)) {
        return NextResponse.json({ success: false, error: { message: "Invalid status" } }, { status: 400 });
      }
      updateData.status = updateFields.status;
    }
    if (updateFields.notes !== undefined) updateData.notes = updateFields.notes;
    if (updateFields.responseNotes !== undefined) updateData.responseNotes = updateFields.responseNotes;

    const updatedRecord = await db.municipalityCorrespondence.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error("Error updating municipality correspondence:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update record" } },
      { status: 500 }
    );
  }
}

// DELETE - Delete correspondence record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "id is required" } },
        { status: 400 }
      );
    }

    await db.municipalityCorrespondence.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting municipality correspondence:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete record" } },
      { status: 500 }
    );
  }
}
