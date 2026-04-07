import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch assignments for a project (with user data)
// GET: Fetch all users for adding dialog
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Fetch assignments for this project with user data
      const assignments = await db.projectAssignment.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
              department: true,
              position: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(assignments);
    }

    // If no projectId, return all assignments
    const assignments = await db.projectAssignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
          },
        },
        project: {
          select: { id: true, name: true, nameEn: true, number: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Add a member to a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, role } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "projectId and userId are required" },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await db.projectAssignment.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already assigned to this project" },
        { status: 409 }
      );
    }

    const assignment = await db.projectAssignment.create({
      data: {
        projectId,
        userId,
        role: role || "team_member",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating project assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

// PUT: Update assignment role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json(
        { error: "id and role are required" },
        { status: 400 }
      );
    }

    const assignment = await db.projectAssignment.update({
      where: { id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            department: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating project assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

// DELETE: Remove member from project
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await db.projectAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
