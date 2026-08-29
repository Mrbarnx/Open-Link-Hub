import { NextResponse } from "next/server";
import { getR2Binding } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const object = await getR2Binding().get("favicon/current");
    if (object) {
      return new Response(object.body, {
        headers: {
          "content-type": object.httpMetadata?.contentType ?? "image/png",
          "cache-control": "public, no-cache, must-revalidate",
          "x-content-type-options": "nosniff",
        },
      });
    }
  } catch {
    // The generic icon remains available while R2 is empty or unavailable.
  }
  return NextResponse.redirect(new URL("/favicon.svg", request.url), 307);
}
