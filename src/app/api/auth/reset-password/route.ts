import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { validateRequest, resetPasswordSchema } from '@/lib/api-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequest(resetPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { token, password } = validation.data;

    // Find user with valid token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
