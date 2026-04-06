import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const approvals = await db.govApproval.findMany({
      where: { projectId: id },
      orderBy: { authority: "asc" },
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
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
    const { approvals } = body as {
      approvals: Array<{
        id: string;
        status: string;
        submissionDate?: string;
        approvalDate?: string;
        rejectionCount?: number;
        notes?: string;
      }>;
    };

    if (!Array.isArray(approvals)) {
      return NextResponse.json(
        { error: "approvals must be an array" },
        { status: 400 }
      );
    }

    const updated = await Promise.all(
      approvals.map((approval) =>
        db.govApproval.update({
          where: { id: approval.id },
          data: {
            ...(approval.status && { status: approval.status }),
            ...(approval.submissionDate && {
              submissionDate: new Date(approval.submissionDate),
            }),
            ...(approval.approvalDate && {
              approvalDate: new Date(approval.approvalDate),
            }),
            ...(approval.rejectionCount !== undefined && {
              rejectionCount: approval.rejectionCount,
            }),
            ...(approval.notes !== undefined && { notes: approval.notes }),
          },
        })
      )
    );

    return NextResponse.json({ approvals: updated });
  } catch (error) {
    console.error("Error updating approvals:", error);
    return NextResponse.json(
      { error: "Failed to update approvals" },
      { status: 500 }
    );
  }
}
