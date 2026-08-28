"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(result.message ?? "Unable to sign in.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setMessage("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <div className="admin-login-title">
        <span><LockKeyhole size={19} /></span>
        <div><p>Private access</p><h1>Admin sign in</h1></div>
      </div>
      <label>
        Username
        <input name="username" autoComplete="username" required maxLength={80} />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      {message ? <p className="admin-form-message" role="alert">{message}</p> : null}
      <button type="submit" disabled={loading}>
        <LogIn size={16} /> {loading ? "Checking…" : "Sign in"}
      </button>
      <small>Five failed attempts trigger a 30-minute lockout.</small>
    </form>
  );
}
