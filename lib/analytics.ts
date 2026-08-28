import { getD1Binding } from "./runtime-env";

export type AnalyticsSummary = {
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
  last7Days: Array<{ day: string; views: number; clicks: number }>;
  topTargets: Array<{ targetId: string; clicks: number }>;
};

export async function recordEvent(eventType: "view" | "click", targetId?: string) {
  await getD1Binding().prepare(
    "INSERT INTO analytics_events (id, event_type, target_id, created_at) VALUES (?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), eventType, targetId ?? null, Date.now()).run();
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const db = getD1Binding();
    const [views, clicks, days, targets] = await db.batch([
      db.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'view'"),
      db.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'click'"),
      db.prepare("SELECT date(created_at / 1000, 'unixepoch') AS day, SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) AS views, SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks FROM analytics_events WHERE created_at >= ? GROUP BY day ORDER BY day ASC").bind(Date.now() - 7 * 24 * 60 * 60 * 1000),
      db.prepare("SELECT target_id, COUNT(*) AS clicks FROM analytics_events WHERE event_type = 'click' AND target_id IS NOT NULL GROUP BY target_id ORDER BY clicks DESC LIMIT 5"),
    ]);
    const totalViews = Number((views.results?.[0] as { count?: number } | undefined)?.count ?? 0);
    const totalClicks = Number((clicks.results?.[0] as { count?: number } | undefined)?.count ?? 0);
    return {
      totalViews,
      totalClicks,
      clickThroughRate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 1000) / 10 : 0,
      last7Days: ((days.results ?? []) as Array<Record<string, unknown>>).map((row) => ({ day: String(row.day), views: Number(row.views), clicks: Number(row.clicks) })),
      topTargets: ((targets.results ?? []) as Array<Record<string, unknown>>).map((row) => ({ targetId: String(row.target_id), clicks: Number(row.clicks) })),
    };
  } catch {
    return { totalViews: 0, totalClicks: 0, clickThroughRate: 0, last7Days: [], topTargets: [] };
  }
}
