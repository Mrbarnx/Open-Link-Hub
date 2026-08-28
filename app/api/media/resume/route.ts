import { NextResponse } from "next/server";
import { getR2Binding } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const object = await getR2Binding().get("resume/current");
    if (object) {
      return new Response(object.body, {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="resume.pdf"',
          "cache-control": "private, no-cache, no-store, must-revalidate",
          "x-content-type-options": "nosniff",
        },
      });
    }
  } catch {
    // A résumé becomes available after the owner uploads one in Admin.
  }
  return NextResponse.json({ message: "No résumé has been uploaded yet." }, { status: 404 });
}
