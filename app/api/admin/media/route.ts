import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isSameOrigin, verifySessionToken } from "../../../../lib/admin-auth";
import { getR2Binding } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FAVICON_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Request rejected." }, { status: 403 });
  }
  const session = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 9 * 1024 * 1024) {
    return NextResponse.json({ message: "The selected file is too large." }, { status: 413 });
  }

  try {
    const form = await request.formData();
    const kind = form.get("kind");
    const file = form.get("file");
    if (!(file instanceof File) || (kind !== "profile" && kind !== "favicon" && kind !== "resume")) {
      return NextResponse.json({ message: "Choose a valid file." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (kind === "profile") {
      if (bytes.length > 4 * 1024 * 1024 || !PHOTO_TYPES.has(file.type) || !isImage(bytes, file.type)) {
        return NextResponse.json({ message: "Use a JPG, PNG or WebP image smaller than 4 MB." }, { status: 400 });
      }
      await getR2Binding().put("profile/current", bytes, {
        httpMetadata: { contentType: file.type },
      });
      return NextResponse.json({ ok: true, url: `/api/media/profile?v=${Date.now()}` });
    }

    if (kind === "favicon") {
      if (bytes.length > 1024 * 1024 || !FAVICON_TYPES.has(file.type) || !isFavicon(bytes, file.type)) {
        return NextResponse.json({ message: "Use a valid PNG, JPG, WebP or ICO image smaller than 1 MB." }, { status: 400 });
      }
      await getR2Binding().put("favicon/current", bytes, {
        httpMetadata: { contentType: file.type },
      });
      return NextResponse.json({ ok: true, url: `/api/media/favicon?v=${Date.now()}` });
    }

    if (bytes.length > 8 * 1024 * 1024 || file.type !== "application/pdf" || !isPdf(bytes)) {
      return NextResponse.json({ message: "Use a valid PDF smaller than 8 MB." }, { status: 400 });
    }
    await getR2Binding().put("resume/current", bytes, {
      httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: 'attachment; filename="resume.pdf"',
      },
    });
    return NextResponse.json({ ok: true, url: `/api/media/resume?v=${Date.now()}` });
  } catch {
    return NextResponse.json({ message: "The upload could not be completed." }, { status: 503 });
  }
}

function isPdf(bytes: Uint8Array): boolean {
  return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

function isImage(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

function isFavicon(bytes: Uint8Array, type: string): boolean {
  if (PHOTO_TYPES.has(type)) return isImage(bytes, type);
  return bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00;
}
