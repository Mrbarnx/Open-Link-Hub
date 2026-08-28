import { cookies } from "next/headers";
import { getSecret } from "./runtime-env";

export const ADMIN_COOKIE = "__Host-open_link_hub_admin";
const SESSION_SECONDS = 60 * 60 * 12;
const encoder = new TextEncoder();

type SessionPayload = {
  sub: string;
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret("ADMIN_SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function safeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = fromBase64Url(getSecret("ADMIN_PASSWORD_DIGEST"));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret("ADMIN_PASSWORD_PEPPER")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const candidate = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(password)),
  );
  return safeEqual(candidate, expected);
}

export function verifyUsername(username: string): boolean {
  const expected = encoder.encode(getSecret("ADMIN_USERNAME"));
  const candidate = encoder.encode(username);
  return safeEqual(candidate, expected);
}

export async function createSession(username: string) {
  const payload: SessionPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return { token: `${body}.${await sign(body)}`, maxAge: SESSION_SECONDS };
}

export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, suppliedSignature] = token.split(".");
  if (!body || !suppliedSignature) return null;

  const expectedSignature = await sign(body);
  if (!safeEqual(encoder.encode(suppliedSignature), encoder.encode(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as SessionPayload;
    if (
      payload.sub !== getSecret("ADMIN_USERNAME") ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
