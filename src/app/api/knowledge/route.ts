import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { validateRequest, knowledgeArticleSchema } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const articles = await db.knowledgeArticle.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching knowledge articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequest(knowledgeArticleSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, errors: validation.errors }, { status: 400 });
    }

    const { title, content, category, tags, authorId } = body;

    const article = await db.knowledgeArticle.create({
      data: {
        title: title || "",
        content: content || "",
        category: category || "guide",
        tags: tags || "",
        authorId: authorId || null,
        views: 0,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Error creating knowledge article:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
