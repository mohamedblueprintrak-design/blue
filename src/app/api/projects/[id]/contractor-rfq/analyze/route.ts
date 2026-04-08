import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/projects/[id]/contractor-rfq/analyze - AI analysis of quotes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get all bids with quotes for this project
    const bids = await db.bid.findMany({
      where: {
        projectId: id,
        quoteFile: { not: '' },
      },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            companyName: true,
            rating: true,
            category: true,
            experience: true,
          },
        },
      },
    });

    if (bids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 quotes are required for comparison' },
        { status: 400 }
      );
    }

    // Build analysis data
    const analysisData = bids.map((bid) => ({
      bidId: bid.id,
      contractorName: bid.contractor?.companyName || bid.contractorName,
      amount: bid.amount,
      rating: bid.contractor?.rating || 0,
      technicalScore: bid.technicalScore,
      financialScore: bid.financialScore,
      totalScore: bid.totalScore,
    }));

    // Sort by total score descending for ranking
    const ranked = [...analysisData].sort((a, b) => b.totalScore - a.totalScore);

    // Generate AI analysis text
    const bestBid = ranked[0];
    const analysisText = `بناءً على تحليل العروض المقدمة:\n- أفضل عرض: ${bestBid.contractorName} بمبلغ ${bestBid.amount.toLocaleString()} درهم\n- التقييم: ${bestBid.rating}/5 نجوم\n- المجموع: ${bestBid.totalScore}%\n\nتوصية: يُنصح بترسية المشروع على ${bestBid.contractorName} نظراً للتوازن بين السعر والجودة والخبرة.`;

    // Update bids with analysis
    for (const bid of bids) {
      await db.bid.update({
        where: { id: bid.id },
        data: {
          rfqStatus: 'reviewing',
          aiAnalysis: analysisText,
        },
      });
    }

    return NextResponse.json({
      analysis: analysisText,
      ranked,
      bids: analysisData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze quotes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
