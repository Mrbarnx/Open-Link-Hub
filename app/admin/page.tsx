import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";
import { getAnalyticsSummary } from "../../lib/analytics";
import { getProducts, getProfileLinks } from "../../lib/content-data";
import { getCvContent } from "../../lib/cv-content";
import { getSiteSettings } from "../../lib/site-settings";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const [settings, links, products, cv, analytics] = await Promise.all([
    getSiteSettings(),
    getProfileLinks(),
    getProducts(),
    getCvContent(),
    getAnalyticsSummary(),
  ]);
  return <AdminDashboard initialSettings={settings} initialLinks={links} initialProducts={products} initialCv={cv} analytics={analytics} username={session.sub} />;
}
