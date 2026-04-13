import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateRequest, changePasswordSchema } from '@/lib/api-validation';

/**
 * PUT /api/profile/password - Change password
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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
    const { currentPassword, newPassword, confirmPassword } = validation.data;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "المستخدم غير موجود أو لم يتم تعيين كلمة مرور" },
        { status: 404 }
      );
    }

    // Verify current password (support both bcrypt hash and plain text)
    let isPasswordValid = false;
    if (user.password.startsWith("$2")) {
      // bcrypt hash
      const bcrypt = await import("bcryptjs");
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      // plain text (SQLite demo env)
      isPasswordValid = user.password === currentPassword;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    // Store new password (plain text for SQLite env, same pattern as login)
    await db.user.update({
      where: { id: user.id },
      data: { password: newPassword },
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
