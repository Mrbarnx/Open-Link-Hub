import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createSession,
  isSameOrigin,
  verifyPassword,
  verifyUsername,
} from "../../../../lib/admin-auth";
import {
  clearLoginFailures,
  getRateLimit,
  loginRateKey,
  recordLoginFailure,
} from "../../../../lib/admin-rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Unable to sign in." }, { status: 403 });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Unable to sign in." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || username.length > 80 || password.length > 200) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }

  let stage = "rate-limit-check";
  try {
    const rateKey = await loginRateKey(request, username);
    const limit = await getRateLimit(rateKey);
    if (limit.blocked) {
      return NextResponse.json(
        { message: "Too many attempts. Try again later." },
        { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
      );
    }

    stage = "credential-verification";
    const [usernameValid, passwordValid] = await Promise.all([
      Promise.resolve(verifyUsername(username)),
      verifyPassword(password),
    ]);

    if (!usernameValid || !passwordValid) {
      stage = "failure-recording";
      const updatedLimit = await recordLoginFailure(rateKey);
      return NextResponse.json(
        { message: updatedLimit.blocked ? "Too many attempts. Try again later." : "Invalid username or password." },
        { status: updatedLimit.blocked ? 429 : 401 },
      );
    }

    stage = "session-creation";
    await clearLoginFailures(rateKey);
    const session = await createSession(username);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    console.error("Admin login backend failure", {
      stage,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { message: "Sign in is temporarily unavailable." },
      { status: 503 },
    );
  }
}
