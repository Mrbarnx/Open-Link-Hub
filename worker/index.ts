/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env { ASSETS: Fetcher; DB: D1Database; BUCKET: R2Bucket; IMAGES: { input(stream: ReadableStream): { transform(options: Record<string, unknown>): { output(options: { format: string; quality: number }): Promise<{ response(): Response }> } } } }
interface ExecutionContext { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void }

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, { fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))), transformImage: async (body, { width, format, quality }) => { const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality }); return result.response(); } }, allowedWidths);
    }
    if (url.pathname === "/favicon.ico") return Response.redirect(new URL("/api/media/favicon", request.url), 307);
    if (request.method === "TRACE" || request.method === "CONNECT") return new Response("Method not allowed", { status: 405 });

    const response = await handler.fetch(request, env, ctx);
    const secured = new Response(response.body, response);
    const headers = secured.headers;
    headers.set("X-Content-Type-Options", "nosniff");
    // The public profile may be previewed only inside the Barnx portfolio.
    // Admin and API routes remain impossible to frame.
    const framePolicy = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/") ? "'none'" : "'self' https://barnx.indevs.in";
    headers.delete("X-Frame-Options");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    headers.set("Content-Security-Policy", `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors ${framePolicy}; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'`);
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) {
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    return secured;
  },
};

export default worker;
