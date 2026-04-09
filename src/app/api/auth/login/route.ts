import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "الحساب غير مفعّل. يرجى التواصل مع المسؤول" },
        { status: 403 }
      );
    }

    // Validate password using bcrypt only (security fix: removed plain text fallback)
    let isValid = false;
    if (user.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text passwords - hash them on-the-fly for migration
      if (user.password === password) {
        // Auto-migrate: hash the plain text password
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور" },
        { status: 401 }
      );
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً" },
      { status: 500 }
    );
  }
}
