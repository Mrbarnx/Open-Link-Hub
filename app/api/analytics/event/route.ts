import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "../../../../lib/analytics";
import { isSameOrigin } from "../../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 500) return new NextResponse(null, { status: 413 });
  try {
    const input = await request.json() as { eventType?: unknown; targetId?: unknown };
    if (input.eventType !== "view" && input.eventType !== "click") return new NextResponse(null, { status: 400 });
    const targetId = typeof input.targetId === "string" && /^[a-z0-9:-]{2,100}$/.test(input.targetId) ? input.targetId : undefined;
    if (input.eventType === "click" && !targetId) return new NextResponse(null, { status: 400 });
    await recordEvent(input.eventType, targetId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
