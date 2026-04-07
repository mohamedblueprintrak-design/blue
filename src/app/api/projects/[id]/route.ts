import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true, phone: true },
        },
        contractor: {
          select: { id: true, name: true, nameEn: true, companyName: true, companyEn: true, contactPerson: true, phone: true, email: true, category: true, rating: true, crNumber: true, licenseNumber: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, avatar: true, department: true, position: true } },
          },
        },
        stages: {
          orderBy: [{ department: "asc" }, { stageOrder: "asc" }],
        },
        govApprovals: true,
        muniRejections: true,
        boqItems: {
          orderBy: { code: "asc" },
        },
        schedulePhases: {
          orderBy: [{ section: "asc" }, { phaseOrder: "asc" }],
        },
        invoices: {
          orderBy: { issueDate: "desc" },
        },
        contracts: true,
        budgets: true,
        siteVisits: {
          orderBy: { date: "desc" },
        },
        defects: {
          orderBy: { createdAt: "desc" },
        },
        siteDiaries: {
          orderBy: { date: "desc" },
        },
        clientInteractions: {
          orderBy: { date: "desc" },
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const taskStats = {
      total: project.tasks.length,
      todo: project.tasks.filter((t) => t.status === "todo").length,
      inProgress: project.tasks.filter((t) => t.status === "in_progress").length,
      review: project.tasks.filter((t) => t.status === "review").length,
      done: project.tasks.filter((t) => t.status === "done").length,
    };

    const stagesByDepartment: Record<string, typeof project.stages> = {};
    for (const stage of project.stages) {
      if (!stagesByDepartment[stage.department]) {
        stagesByDepartment[stage.department] = [];
      }
      stagesByDepartment[stage.department].push(stage);
    }

    const scheduleBySection: Record<string, typeof project.schedulePhases> = {};
    for (const phase of project.schedulePhases) {
      if (!scheduleBySection[phase.section]) {
        scheduleBySection[phase.section] = [];
      }
      scheduleBySection[phase.section].push(phase);
    }

    return NextResponse.json({
      ...project,
      taskStats,
      stagesByDepartment,
      scheduleBySection,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
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

    const project = await db.project.update({
      where: { id },
      data: body,
      include: {
        client: { select: { id: true, name: true, company: true } },
        contractor: { select: { id: true, name: true, companyName: true } },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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

    await db.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
