import { env } from "cloudflare:workers";

type RuntimeBindings = Record<string, unknown>;

function bindings(): RuntimeBindings {
  return env as unknown as RuntimeBindings;
}

export function getSecret(name: string): string {
  const value = bindings()[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Required runtime secret ${name} is unavailable.`);
  }
  return value;
}

export function getOptionalSecret(name: string): string | undefined {
  const value = bindings()[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getPublicSiteUrl(): string {
  const value = getOptionalSecret("SITE_URL") ?? "https://example.com";
  try {
    return new URL(value).origin;
  } catch {
    return "https://example.com";
  }
}

export function getD1Binding() {
  const database = bindings().DB;
  if (!database) {
    throw new Error("Cloudflare D1 binding DB is unavailable.");
  }
  return database as D1Database;
}

type R2ObjectLike = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
};

type R2BucketLike = {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: { httpMetadata?: { contentType?: string; contentDisposition?: string } },
  ): Promise<unknown>;
};

export function getR2Binding(): R2BucketLike {
  const bucket = bindings().BUCKET;
  if (!bucket) {
    throw new Error("Cloudflare R2 binding BUCKET is unavailable.");
  }
  return bucket as R2BucketLike;
}
