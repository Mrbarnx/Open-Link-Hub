import { NextResponse } from "next/server";
import { getR2Binding } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const object = await getR2Binding().get("profile/current");
    if (object) {
      return new Response(object.body, {
        headers: {
          "content-type": object.httpMetadata?.contentType ?? "image/jpeg",
          "cache-control": "private, no-cache, no-store, must-revalidate",
          "x-content-type-options": "nosniff",
        },
      });
    }
  } catch {
    // The generic placeholder remains available while R2 is empty or unavailable.
  }
  return NextResponse.redirect(new URL("/profile-placeholder.svg", request.url), 307);
}
