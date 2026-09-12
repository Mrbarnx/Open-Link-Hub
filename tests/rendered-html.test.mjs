import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("production output and security policy are present", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/client", import.meta.url));
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /X-Frame-Options/);
  assert.match(worker, /TRACE/);
  assert.match(worker, /X-Robots-Tag/);
});

test("SEO routes and sanitized defaults are present", async () => {
  const [layout, page, settings, cv] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-settings.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/cv-content.ts", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /openGraph/);
  assert.match(layout, /alternates/);
  assert.match(page, /application\/ld\+json/);
  assert.match(settings, /Your Name/);
  assert.doesNotMatch(`${settings}\n${cv}`, /Barnabas|Mrbarnx|Human Anatomy|FUTO/i);
});

test("admin-managed favicon uses validated R2 media", async () => {
  const [layout, settings, upload, favicon] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-settings.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/media/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/media/favicon/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /settings\.faviconUrl/);
  assert.match(layout, /force-dynamic/);
  assert.match(layout, /rel="icon" href=\{settings\.faviconUrl\}/);
  assert.match(layout, /rel="shortcut icon" href=\{settings\.faviconUrl\}/);
  assert.match(layout, /rel="apple-touch-icon" href=\{settings\.faviconUrl\}/);
  assert.match(settings, /favicon_url/);
  assert.match(upload, /favicon\/current/);
  assert.match(upload, /smaller than 1 MB/);
  assert.match(favicon, /x-content-type-options/);
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /url\.pathname === "\/favicon\.ico"/);
  assert.match(worker, /\/api\/media\/favicon/);
});
