import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateRequest, changePasswordSchema } from '@/lib/api-validation';
import { hash, compare } from "bcryptjs";

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
    const { currentPassword, newPassword } = validation.data;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "المستخدم غير موجود أو لم يتم تعيين كلمة مرور" },
        { status: 404 }
      );
    }

    // Verify current password using bcrypt (support both bcrypt hash and legacy plain text)
    let isPasswordValid = false;
    if (user.password.startsWith("$2")) {
      // bcrypt hash
      isPasswordValid = await compare(currentPassword, user.password);
    } else {
      // Legacy plain text (should not happen in production)
      isPasswordValid = user.password === currentPassword;
    }

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
