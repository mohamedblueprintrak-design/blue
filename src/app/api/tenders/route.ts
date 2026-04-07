import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const authority = searchParams.get("authority");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (authority && authority !== "all") {
      where.authority = authority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tenderNumber: { contains: search } },
        { authority: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tenders, total] = await Promise.all([
      db.tender.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { closingDate: { sort: "asc", nulls: "last" } },
        skip,
        take: limit,
      }),
      db.tender.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    return NextResponse.json({ tenders, total, page, limit });
  } catch (error) {
    console.error("Error fetching tenders:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const tender = await db.tender.create({
      data: {
        tenderNumber: tenderNumber || "",
        title,
        authority: authority || "",
        projectType: projectType || "",
        description: description || "",
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : 0,
        currency: currency || "AED",
        closingDate: closingDate ? new Date(closingDate) : null,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        qualifications: qualifications || "",
        requiredDocs: requiredDocs || "",
        status: status || "identified",
        winnerName: winnerName || "",
        lostReason: lostReason || "",
        competitorAnalysis: competitorAnalysis || "",
        notes: notes || "",
        source: source || "",
        sourceUrl: sourceUrl || "",
        assignedTo: assignedTo || null,
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

    return NextResponse.json(tender, { status: 201 });
  } catch (error) {
    console.error("Error creating tender:", error);
    return NextResponse.json(
      { error: "Failed to create tender" },
      { status: 500 }
    );
  }
}
