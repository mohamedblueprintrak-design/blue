import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/bids/[id]/evaluate
// Save or update evaluation criteria scores for a bid.
// Accepts a single criteria object or an array of criteria objects.
// After saving, recalculates totalScore as the weighted average of all evaluations.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bidId } = await params;
    const body = await request.json();

    const bid = await db.bid.findUnique({ where: { id: bidId } });
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    // Accept single object or array of evaluation criteria
    const criteriaList = Array.isArray(body) ? body : [body];

    const savedEvaluations = [];

    for (const item of criteriaList) {
      const { criteria, score, maxScore, weight, notes, evaluatedBy } = item;

      if (!criteria) {
        return NextResponse.json(
          { error: "Criteria name is required" },
          { status: 400 }
        );
      }

      const parsedScore = score !== undefined ? parseInt(String(score), 10) : 0;
      const parsedMaxScore = maxScore !== undefined ? parseInt(String(maxScore), 10) : 100;
      const parsedWeight = weight !== undefined ? parseFloat(String(weight)) : 1;

      // Find existing evaluation for this bid + criteria combination
      const existing = await db.contractorEvaluation.findFirst({
        where: { bidId, criteria },
      });

      let evaluation;
      if (existing) {
        evaluation = await db.contractorEvaluation.update({
          where: { id: existing.id },
          data: {
            score: parsedScore,
            maxScore: parsedMaxScore,
            weight: parsedWeight,
            ...(notes !== undefined && { notes }),
            ...(evaluatedBy !== undefined && { evaluatedBy }),
          },
        });
      } else {
        evaluation = await db.contractorEvaluation.create({
          data: {
            contractorId: bid.contractorId || "",
            projectId: bid.projectId,
            bidId: bid.id,
            criteria,
            score: parsedScore,
            maxScore: parsedMaxScore,
            weight: parsedWeight,
            notes: notes || "",
            evaluatedBy: evaluatedBy || "",
          },
        });
      }

      savedEvaluations.push(evaluation);
    }

    // Recalculate totalScore as weighted average of all evaluations for this bid
    const allEvaluations = await db.contractorEvaluation.findMany({
      where: { bidId },
    });

    let newTotalScore = 0;
    if (allEvaluations.length > 0) {
      const totalWeight = allEvaluations.reduce((sum, ev) => sum + ev.weight, 0);
      if (totalWeight > 0) {
        const weightedSum = allEvaluations.reduce((sum, ev) => {
          const normalizedScore = ev.maxScore > 0 ? ev.score / ev.maxScore : 0;
          return sum + normalizedScore * ev.weight;
        }, 0);
        newTotalScore = Math.round((weightedSum / totalWeight) * 100 * 100) / 100;
      }
    }

    // Update the bid with the new totalScore
    const updatedBid = await db.bid.update({
      where: { id: bidId },
      data: { totalScore: newTotalScore },
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

    return NextResponse.json({
      evaluations: savedEvaluations,
      bid: updatedBid,
    });
  } catch (error) {
    console.error("Error saving bid evaluation:", error);
    return NextResponse.json(
      { error: "Failed to save evaluation" },
      { status: 500 }
    );
  }
}
