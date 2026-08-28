import { getD1Binding } from "./runtime-env";
import { isAllowedUrl } from "./site-settings";

export type CvSkillGroup = { label: string; items: string[] };
export type CvExperience = {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
};
export type CvProject = {
  title: string;
  stack: string;
  description: string;
  url: string;
};
export type CvEducation = {
  degree: string;
  period: string;
  institution: string;
  location: string;
};
export type CvContent = {
  summary: string;
  skills: CvSkillGroup[];
  experience: CvExperience[];
  projects: CvProject[];
  education: CvEducation[];
};

const CV_SETTING_KEY = "cv_content_json";

export const defaultCvContent: CvContent = {
  summary: "A short professional summary goes here. Describe your strongest skills, the people you help and the value you create.",
  skills: [
    { label: "Core skills", items: ["Product design", "Web development", "Communication", "Problem solving"] },
    { label: "Tools", items: ["Your tool", "Another tool", "Favourite platform"] },
  ],
  experience: [
    {
      role: "Your Current Role",
      company: "Company or Client",
      location: "Remote",
      period: "2025 - Present",
      bullets: [
        "Describe a measurable result you delivered in this role.",
        "Explain another useful responsibility or achievement.",
      ],
    },
  ],
  projects: [
    {
      title: "Featured Project",
      stack: "Your stack or tools",
      description: "Explain the problem, what you built and the outcome.",
      url: "https://example.com/project",
    },
  ],
  education: [
    {
      degree: "Your Degree or Certification",
      period: "2022 - 2026",
      institution: "Your Institution",
      location: "Your Location",
    },
  ],
};

export async function getCvContent(): Promise<CvContent> {
  try {
    const row = await getD1Binding()
      .prepare("SELECT setting_value FROM site_settings WHERE setting_key = ?")
      .bind(CV_SETTING_KEY)
      .first<{ setting_value: string }>();
    return row ? parseCvContent(JSON.parse(row.setting_value)) ?? defaultCvContent : defaultCvContent;
  } catch {
    return defaultCvContent;
  }
}

export async function saveCvContent(content: CvContent): Promise<void> {
  await getD1Binding()
    .prepare("INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at")
    .bind(CV_SETTING_KEY, JSON.stringify(content), Date.now())
    .run();
}

export function parseCvContent(value: unknown): CvContent | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const summary = clean(input.summary, 40, 1600);
  const skills = parseArray(input.skills, 1, 8, (item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const label = clean(row.label, 2, 80);
    const items = parseStringArray(row.items, 1, 30, 1, 80);
    return label && items ? { label, items } : null;
  });
  const experience = parseArray(input.experience, 1, 10, (item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const role = clean(row.role, 2, 120);
    const company = clean(row.company, 2, 100);
    const location = clean(row.location, 0, 80);
    const period = clean(row.period, 2, 80);
    const bullets = parseStringArray(row.bullets, 1, 10, 4, 500);
    return role && company && location !== null && period && bullets ? { role, company, location, period, bullets } : null;
  });
  const projects = parseArray(input.projects, 1, 8, (item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const title = clean(row.title, 2, 120);
    const stack = clean(row.stack, 2, 240);
    const description = clean(row.description, 10, 700);
    const url = clean(row.url, 0, 300);
    if (!title || !stack || !description || url === null || (url && !isAllowedUrl(url, false))) return null;
    return { title, stack, description, url };
  });
  const education = parseArray(input.education, 1, 4, (item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const degree = clean(row.degree, 2, 180);
    const period = clean(row.period, 2, 80);
    const institution = clean(row.institution, 2, 180);
    const location = clean(row.location, 0, 80);
    return degree && period && institution && location !== null ? { degree, period, institution, location } : null;
  });
  return summary && skills && experience && projects && education
    ? { summary, skills, experience, projects, education }
    : null;
}

function clean(value: unknown, min: number, max: number): string | null {
  const result = typeof value === "string" ? value.trim() : "";
  return result.length >= min && result.length <= max ? result : null;
}

function parseStringArray(value: unknown, minItems: number, maxItems: number, minLength: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length < minItems || value.length > maxItems) return null;
  const items = value.map((item) => clean(item, minLength, maxLength));
  return items.every((item): item is string => item !== null) ? items : null;
}

function parseArray<T>(value: unknown, min: number, max: number, parser: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value) || value.length < min || value.length > max) return null;
  const parsed = value.map(parser);
  return parsed.every((item): item is T => item !== null) ? parsed : null;
}
