import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get("riskLevel");
    const inspectionType = searchParams.get("inspectionType");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (inspectionType) where.inspectionType = inspectionType;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const inspections = await db.buildingInspection.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
        findings: true,
        _count: {
          select: { photos: true, findings: true },
        },
      },
      orderBy,
    });

    // Calculate stats
    const allInspections = await db.buildingInspection.findMany({
      select: { riskLevel: true, status: true },
    });

    const stats = {
      total: allInspections.length,
      green: allInspections.filter((i) => i.riskLevel === "green").length,
      yellow: allInspections.filter((i) => i.riskLevel === "yellow").length,
      orange: allInspections.filter((i) => i.riskLevel === "orange").length,
      red: allInspections.filter((i) => i.riskLevel === "red").length,
      needsFollowup: allInspections.filter((i) => i.status === "followup_needed").length,
    };

    return NextResponse.json({ inspections, stats });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      clientId,
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

    if (!inspectionDate) {
      return NextResponse.json({ error: "Inspection date is required" }, { status: 400 });
    }

    // Generate inspection number
    const count = await db.buildingInspection.count();
    const inspectionNumber = `INS-${String(count + 1).padStart(4, "0")}`;

    // Calculate auto risk level based on findings if not provided
    let calculatedRiskLevel = riskLevel || "green";
    if (findings && findings.length > 0 && !riskLevel) {
      const severities = findings.map((f: { severity?: string }) => f.severity || "low");
      if (severities.includes("critical")) calculatedRiskLevel = "red";
      else if (severities.includes("high")) calculatedRiskLevel = "orange";
      else if (severities.includes("medium")) calculatedRiskLevel = "yellow";
      else calculatedRiskLevel = "green";
    }

    // Calculate total repair estimate from findings
    let totalRepair = repairEstimate || 0;
    if (findings && findings.length > 0 && !repairEstimate) {
      totalRepair = findings.reduce((sum: number, f: { estimatedCost?: number }) => sum + (f.estimatedCost || 0), 0);
    }

    const inspection = await db.buildingInspection.create({
      data: {
        inspectionNumber,
        projectId: projectId || null,
        clientId: clientId || null,
        buildingName: buildingName || "",
        buildingAddress: buildingAddress || "",
        inspectionType: inspectionType || "",
        riskLevel: calculatedRiskLevel,
        inspectionDate: new Date(inspectionDate),
        nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
        inspectorName: inspectorName || "",
        summary: summary || "",
        recommendations: recommendations || "",
        repairEstimate: totalRepair,
        status: status || "draft",
        findings: findings
          ? {
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
            }
          : undefined,
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

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}
