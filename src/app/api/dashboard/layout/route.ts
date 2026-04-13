import { NextResponse } from "next/server";

// GET /api/dashboard/layout
// Returns a placeholder response — actual layout persistence is handled via localStorage on the client.
export async function GET() {
  return NextResponse.json({
    storageKey: "blueprint-dashboard-layout",
    note: "Dashboard layout is persisted in localStorage on the client side. This endpoint is reserved for future server-side sync.",
  });
}

// POST /api/dashboard/layout
// Accepts layout data for future server-side persistence.
export async function POST(request: Request) {
  try {
    const _body = await request.json();
    // In the future, this could persist to a database or user settings.
    // For now, layout is stored in localStorage on the client.
    return NextResponse.json({ success: true, message: "Layout acknowledged (client-side localStorage is primary store)." });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
