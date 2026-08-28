import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isSameOrigin, verifySessionToken } from "../../../../lib/admin-auth";
import { parseLinks, parseProducts, replaceProducts, replaceProfileLinks } from "../../../../lib/content-data";
import { parseCvContent, saveCvContent } from "../../../../lib/cv-content";
import { parseSiteSettings, saveSiteSettings } from "../../../../lib/site-settings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Request rejected." }, { status: 403 });
  }
  const session = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid settings." }, { status: 400 });
  }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const settings = parseSiteSettings(input.settings);
  const links = parseLinks(input.links);
  const products = parseProducts(input.products);
  const cv = parseCvContent(input.cv);
  if (!settings || !links || !products || !cv) {
    return NextResponse.json({ message: "Check the fields and use valid HTTPS or email links." }, { status: 400 });
  }

  try {
    await saveSiteSettings(settings);
    await replaceProfileLinks(links);
    await replaceProducts(products);
    await saveCvContent(cv);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Could not save changes." }, { status: 503 });
  }
}
