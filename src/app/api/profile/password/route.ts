import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRequest, changePasswordSchema } from '@/lib/api-validation';
import { hash, compare } from "bcryptjs";

/**
 * PUT /api/profile/password - Change password
 *
 * Uses JWT-based auth via x-user-id header (set by middleware from blue_token cookie).
 * Do NOT use getServerSession() — the custom JWT login flow never creates a NextAuth session.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateRequest(changePasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    const { currentPassword, newPassword } = validation.data;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "المستخدم غير موجود أو لم يتم تعيين كلمة مرور" },
        { status: 404 }
      );
    }

    // Verify current password using bcrypt only
    // SECURITY: No plain text fallback — all passwords must be bcrypt-hashed
    if (!user.password.startsWith("$2")) {
      // Password is not properly hashed — force reset required
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة. يرجى طلب إعادة تعيين كلمة المرور." },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    // Always hash the new password with bcrypt before storing
    const hashedPassword = await hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
