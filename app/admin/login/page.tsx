import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "../../../lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="admin-page admin-login-page">
      <Link className="admin-back-link" href="/">← Back to website</Link>
      <LoginForm />
    </main>
  );
}
