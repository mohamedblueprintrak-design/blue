import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "public", "upload", "avatars");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/profile/avatar - Upload avatar image
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "لم يتم توفير ملف" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. الأنواع المسموحة: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${user.id}-${timestamp}.${extension}`;
    const filepath = path.join(AVATAR_DIR, filename);

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    if (!existsSync(AVATAR_DIR)) {
      await mkdir(AVATAR_DIR, { recursive: true });
    }

    // Write file to disk
    await writeFile(filepath, buffer);

    // Generate avatar URL
    const avatarUrl = `/upload/avatars/${filename}`;

    // Update user in database
    await db.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ avatar: avatarUrl });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar - Remove avatar
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const currentAvatar = user.avatar || null;

    // Remove from database
    await db.user.update({
      where: { id: user.id },
      data: { avatar: "" },
    });

    // Delete file from disk if exists
    if (currentAvatar && currentAvatar.startsWith("/upload/avatars/")) {
      const filepath = path.join(process.cwd(), "public", currentAvatar);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete avatar error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
