import { getD1Binding } from "./runtime-env";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = {
  failed_count: number;
  window_started: number;
  blocked_until: number;
};

async function hashKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function loginRateKey(request: Request, username: string) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return hashKey(`${ip}|${username.trim().toLowerCase()}`);
}

async function readAttempt(rateKey: string): Promise<Attempt | null> {
  return getD1Binding()
    .prepare(
      "SELECT failed_count, window_started, blocked_until FROM admin_login_attempts WHERE rate_key = ?",
    )
    .bind(rateKey)
    .first<Attempt>();
}

export async function getRateLimit(rateKey: string) {
  const now = Date.now();
  const attempt = await readAttempt(rateKey);
  const retryAfter = attempt && attempt.blocked_until > now
    ? Math.ceil((attempt.blocked_until - now) / 1000)
    : 0;
  return { blocked: retryAfter > 0, retryAfter };
}

export async function recordLoginFailure(rateKey: string) {
  const db = getD1Binding();
  const now = Date.now();
  const windowResetBefore = now - WINDOW_MS;
  const blockUntil = now + BLOCK_MS;
  const statement = `
    INSERT INTO admin_login_attempts
      (rate_key, failed_count, window_started, blocked_until, updated_at)
    VALUES (?, 1, ?, 0, ?)
    ON CONFLICT(rate_key) DO UPDATE SET
      failed_count = CASE
        WHEN window_started <= ? THEN 1
        ELSE failed_count + 1
      END,
      window_started = CASE
        WHEN window_started <= ? THEN ?
        ELSE window_started
      END,
      blocked_until = CASE
        WHEN window_started > ? AND failed_count + 1 >= ? THEN ?
        ELSE blocked_until
      END,
      updated_at = ?
  `;

  await db
    .prepare(statement)
    .bind(
      rateKey,
      now,
      now,
      windowResetBefore,
      windowResetBefore,
      now,
      windowResetBefore,
      MAX_FAILURES,
      blockUntil,
      now,
    )
    .run();

  return getRateLimit(rateKey);
}

export async function clearLoginFailures(rateKey: string) {
  await getD1Binding()
    .prepare("DELETE FROM admin_login_attempts WHERE rate_key = ?")
    .bind(rateKey)
    .run();
}
