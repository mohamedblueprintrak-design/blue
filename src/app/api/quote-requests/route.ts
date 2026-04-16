import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateRequest, quoteRequestSchema } from "@/lib/api-validation";
import { sanitizeString, validateXSS, validateSQLInjection } from "@/lib/security/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validation = validateRequest(quoteRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name, phone, email, serviceType, buildingType, area, floors, location, message } = validation.data;

    // Security: Check for XSS and SQL injection in string fields
    const stringFields = [name, phone, email || "", serviceType || "", buildingType || "", area || "", location || "", message || ""];
    for (const field of stringFields) {
      if (validateXSS(field)) {
        return NextResponse.json(
          { error: "تم رفض الإدخال لأسباب أمنية" },
          { status: 400 }
        );
      }
      if (validateSQLInjection(field)) {
        return NextResponse.json(
          { error: "تم رفض الإدخال لأسباب أمنية" },
          { status: 400 }
        );
      }
    }

    // Sanitize string fields before storing
    const quoteRequest = await db.quoteRequest.create({
      data: {
        name: sanitizeString(name),
        phone: sanitizeString(phone),
        email: sanitizeString(email || ""),
        serviceType: sanitizeString(serviceType || ""),
        buildingType: sanitizeString(buildingType || ""),
        area: sanitizeString(area || ""),
        floors: floors || 1,
        location: sanitizeString(location || ""),
        message: sanitizeString(message || ""),
        status: "new",
      },
    });

    return NextResponse.json({ success: true, id: quoteRequest.id });
  } catch (error) {
    console.error("Error creating quote request:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الطلب" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // SECURITY: Only authenticated users with manager+ role can list quote requests
    // The middleware handles JWT verification and sets x-user-role header
    const userRole = request.headers.get('x-user-role')?.toLowerCase() || '';
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: "صلاحيات غير كافية" },
        { status: 403 }
      );
    }

    const requests = await db.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching quote requests:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الطلبات" },
      { status: 500 }
    );
  }
}
