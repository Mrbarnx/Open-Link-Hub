import { getD1Binding } from "./runtime-env";

export type AccentColor = "#2563eb" | "#7c3aed" | "#0f766e" | "#ea580c";
export type BackgroundStyle = "grid" | "clean" | "soft";
export type CardStyle = "rounded" | "soft-square";

export type SiteSettings = {
  displayName: string;
  headline: string;
  intro: string;
  profileImageUrl: string;
  faviconUrl: string;
  resumeUrl: string;
  location: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  xUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  tiktokUrl: string;
  accentColor: AccentColor;
  backgroundStyle: BackgroundStyle;
  cardStyle: CardStyle;
  showCv: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  displayName: "Your Name",
  headline: "Designer, developer and digital creator",
  intro: "Use this space for a short introduction explaining what you create and what visitors should explore first.",
  profileImageUrl: "/api/media/profile",
  faviconUrl: "/api/media/favicon",
  resumeUrl: "",
  location: "Remote",
  email: "hello@example.com",
  githubUrl: "https://github.com/your-username",
  linkedinUrl: "https://www.linkedin.com/in/your-username",
  xUrl: "https://x.com/your_username",
  instagramUrl: "",
  whatsappUrl: "",
  tiktokUrl: "https://www.tiktok.com/@your_username",
  accentColor: "#2563eb",
  backgroundStyle: "grid",
  cardStyle: "rounded",
  showCv: true,
};

const settingKeys: Record<keyof SiteSettings, string> = {
  displayName: "display_name",
  headline: "headline",
  intro: "profile_intro",
  profileImageUrl: "profile_image_url",
  faviconUrl: "favicon_url",
  resumeUrl: "resume_url",
  location: "location",
  email: "email",
  githubUrl: "github_url",
  linkedinUrl: "linkedin_url",
  xUrl: "x_url",
  instagramUrl: "instagram_url",
  whatsappUrl: "whatsapp_url",
  tiktokUrl: "tiktok_url",
  accentColor: "accent_color",
  backgroundStyle: "background_style",
  cardStyle: "card_style",
  showCv: "show_cv",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const result = await getD1Binding()
      .prepare("SELECT setting_key, setting_value FROM site_settings")
      .all<{ setting_key: string; setting_value: string }>();
    const rows = (result.results ?? []) as Array<{ setting_key: string; setting_value: string }>;
    const saved = new Map<string, string>(rows.map((row) => [row.setting_key, row.setting_value]));
    return {
      displayName: saved.get(settingKeys.displayName) ?? defaultSiteSettings.displayName,
      headline: saved.get(settingKeys.headline) ?? defaultSiteSettings.headline,
      intro: saved.get(settingKeys.intro) ?? defaultSiteSettings.intro,
      profileImageUrl: saved.get(settingKeys.profileImageUrl) ?? defaultSiteSettings.profileImageUrl,
      faviconUrl: saved.get(settingKeys.faviconUrl) ?? defaultSiteSettings.faviconUrl,
      resumeUrl: saved.get(settingKeys.resumeUrl) ?? defaultSiteSettings.resumeUrl,
      location: saved.get(settingKeys.location) ?? defaultSiteSettings.location,
      email: saved.get(settingKeys.email) ?? defaultSiteSettings.email,
      githubUrl: saved.get(settingKeys.githubUrl) || defaultSiteSettings.githubUrl,
      linkedinUrl: saved.get(settingKeys.linkedinUrl) || defaultSiteSettings.linkedinUrl,
      xUrl: saved.get(settingKeys.xUrl) || defaultSiteSettings.xUrl,
      instagramUrl: saved.get(settingKeys.instagramUrl) ?? "",
      whatsappUrl: saved.get(settingKeys.whatsappUrl) ?? "",
      tiktokUrl: saved.get(settingKeys.tiktokUrl) || defaultSiteSettings.tiktokUrl,
      accentColor: parseAccent(saved.get(settingKeys.accentColor)),
      backgroundStyle: parseBackground(saved.get(settingKeys.backgroundStyle)),
      cardStyle: parseCardStyle(saved.get(settingKeys.cardStyle)),
      showCv: saved.get(settingKeys.showCv) !== "false",
    };
  } catch {
    return defaultSiteSettings;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const db = getD1Binding();
  const now = Date.now();
  const statement = "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at";
  await db.batch(
    (Object.keys(settingKeys) as Array<keyof SiteSettings>).map((key) =>
      db.prepare(statement).bind(settingKeys[key], String(settings[key]), now),
    ),
  );
}

export function parseSiteSettings(value: unknown): SiteSettings | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    const result = typeof input[key] === "string" ? input[key].trim() : "";
    return result.length >= min && result.length <= max ? result : null;
  };
  const displayName = text("displayName", 2, 80);
  const headline = text("headline", 4, 120);
  const intro = text("intro", 10, 240);
  const profileImageUrl = mediaUrl(input.profileImageUrl);
  const faviconUrl = mediaUrl(input.faviconUrl);
  const rawResumeUrl = typeof input.resumeUrl === "string" ? input.resumeUrl.trim() : "";
  const resumeUrl = rawResumeUrl ? mediaUrl(rawResumeUrl) : "";
  const location = text("location", 2, 80);
  const email = text("email", 5, 150);
  if (!displayName || !headline || !intro || !profileImageUrl || !faviconUrl || resumeUrl === null || !location || !email || !/^\S+@\S+\.\S+$/.test(email)) return null;

  const urlFields = ["githubUrl", "linkedinUrl", "xUrl", "instagramUrl", "whatsappUrl", "tiktokUrl"] as const;
  const urls: Record<(typeof urlFields)[number], string> = {
    githubUrl: "", linkedinUrl: "", xUrl: "", instagramUrl: "", whatsappUrl: "", tiktokUrl: "",
  };
  for (const field of urlFields) {
    const raw = typeof input[field] === "string" ? input[field].trim() : "";
    if (!raw) continue;
    if (!isAllowedUrl(raw, false)) return null;
    urls[field] = new URL(raw).toString();
  }

  return {
    displayName, headline, intro, profileImageUrl, faviconUrl, resumeUrl, location, email, ...urls,
    accentColor: parseAccent(input.accentColor),
    backgroundStyle: parseBackground(input.backgroundStyle),
    cardStyle: parseCardStyle(input.cardStyle),
    showCv: input.showCv !== false,
  };
}

function mediaUrl(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.startsWith("//") && raw.length <= 300) return raw;
  if (raw.length <= 300 && isAllowedUrl(raw, false)) return new URL(raw).toString();
  return null;
}

export function isAllowedUrl(value: string, allowMailto = true): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (allowMailto && url.protocol === "mailto:");
  } catch {
    return false;
  }
}

function parseAccent(value: unknown): AccentColor {
  const allowed: AccentColor[] = ["#2563eb", "#7c3aed", "#0f766e", "#ea580c"];
  return allowed.includes(value as AccentColor) ? (value as AccentColor) : "#2563eb";
}

function parseBackground(value: unknown): BackgroundStyle {
  return value === "clean" || value === "soft" ? value : "grid";
}

function parseCardStyle(value: unknown): CardStyle {
  return value === "soft-square" ? value : "rounded";
}
