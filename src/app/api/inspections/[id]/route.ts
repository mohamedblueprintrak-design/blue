import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const inspection = await db.buildingInspection.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true, phone: true },
        },
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        findings: {
          orderBy: { createdAt: "asc" },
        },
        photos: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json({ error: "Failed to fetch inspection" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      buildingName,
      buildingAddress,
      inspectionType,
      riskLevel,
      inspectionDate,
      nextInspectionDate,
      inspectorName,
      summary,
      recommendations,
      repairEstimate,
      status,
      findings,
    } = body;

    // If findings are provided, we need to delete existing and recreate
    if (findings !== undefined) {
      await db.inspectionFinding.deleteMany({ where: { inspectionId: id } });
    }

    // Recalculate risk level based on findings
    let calculatedRiskLevel = riskLevel;
    if (findings && findings.length > 0 && !riskLevel) {
      const severities = findings.map((f: { severity?: string }) => f.severity || "low");
      if (severities.includes("critical")) calculatedRiskLevel = "red";
      else if (severities.includes("high")) calculatedRiskLevel = "orange";
      else if (severities.includes("medium")) calculatedRiskLevel = "yellow";
      else calculatedRiskLevel = "green";
    }

    const inspection = await db.buildingInspection.update({
      where: { id },
      data: {
        ...(buildingName !== undefined && { buildingName }),
        ...(buildingAddress !== undefined && { buildingAddress }),
        ...(inspectionType !== undefined && { inspectionType }),
        ...(calculatedRiskLevel !== undefined && { riskLevel: calculatedRiskLevel }),
        ...(inspectionDate !== undefined && { inspectionDate: new Date(inspectionDate) }),
        ...(nextInspectionDate !== undefined && {
          nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
        }),
        ...(inspectorName !== undefined && { inspectorName }),
        ...(summary !== undefined && { summary }),
        ...(recommendations !== undefined && { recommendations }),
        ...(repairEstimate !== undefined && { repairEstimate }),
        ...(status !== undefined && { status }),
        ...(findings !== undefined && {
          findings: {
            create: findings.map((f: Record<string, unknown>) => ({
              location: (f.location as string) || "",
              description: (f.description as string) || "",
              severity: (f.severity as string) || "low",
              category: (f.category as string) || "",
              photos: (f.photos as string) || "",
              remediation: (f.remediation as string) || "",
              estimatedCost: (f.estimatedCost as number) || 0,
              status: (f.status as string) || "open",
            })),
          },
        }),
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        findings: true,
      },
    });

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error updating inspection:", error);
    return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.buildingInspection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inspection:", error);
    return NextResponse.json({ error: "Failed to delete inspection" }, { status: 500 });
  }
}
