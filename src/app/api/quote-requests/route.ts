import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, serviceType, buildingType, area, floors, location, message } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف مطلوبان" },
        { status: 400 }
      );
    }

    const quoteRequest = await db.quoteRequest.create({
      data: {
        name: name || "",
        phone: phone || "",
        email: email || "",
        serviceType: serviceType || "",
        buildingType: buildingType || "",
        area: area || "",
        floors: typeof floors === "number" ? floors : 1,
        location: location || "",
        message: message || "",
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

export async function GET() {
  try {
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
