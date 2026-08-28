import { getD1Binding } from "./runtime-env";
import { isAllowedUrl } from "./site-settings";

export type LinkIcon = "code" | "workflow" | "briefcase" | "link" | "file";

export type ProfileLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LinkIcon;
  isActive: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  label: string;
  title: string;
  description: string;
  url: string;
  buttonText: string;
  isActive: boolean;
  sortOrder: number;
};

export const defaultLinks: ProfileLink[] = [
  { id: "portfolio", title: "Explore My Portfolio", description: "Selected work, case studies and recent projects.", url: "https://example.com/portfolio", icon: "briefcase", isActive: true, sortOrder: 0 },
  { id: "github-projects", title: "GitHub & Projects", description: "Code, experiments and active software builds.", url: "https://github.com/your-username", icon: "code", isActive: true, sortOrder: 1 },
  { id: "newsletter", title: "Read My Newsletter", description: "Ideas, lessons and useful resources.", url: "https://example.com/newsletter", icon: "file", isActive: true, sortOrder: 2 },
  { id: "work-with-me", title: "Work With Me", description: "Tell me about your project or collaboration idea.", url: "mailto:hello@example.com?subject=Project%20enquiry", icon: "briefcase", isActive: true, sortOrder: 3 },
];

export const defaultProducts: Product[] = [
  { id: "starter-product", label: "Featured product", title: "Your Digital Product", description: "Replace this example with your course, download, service or storefront.", url: "https://example.com/product", buttonText: "View product", isActive: true, sortOrder: 0 },
];

export async function getProfileLinks(): Promise<ProfileLink[]> {
  try {
    const result = await getD1Binding().prepare(
      "SELECT id, title, description, url, icon, is_active, sort_order FROM profile_links ORDER BY sort_order ASC, created_at ASC",
    ).all<Record<string, unknown>>();
    const rows = (result.results ?? []) as Array<Record<string, unknown>>;
    if (!rows.length) return defaultLinks;
    return rows.map((row) => ({
      id: String(row.id), title: String(row.title), description: String(row.description),
      url: String(row.url), icon: parseIcon(row.icon), isActive: Boolean(row.is_active), sortOrder: Number(row.sort_order),
    }));
  } catch {
    return defaultLinks;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const result = await getD1Binding().prepare(
      "SELECT id, label, title, description, url, button_text, is_active, sort_order FROM products ORDER BY sort_order ASC, created_at ASC",
    ).all<Record<string, unknown>>();
    const rows = (result.results ?? []) as Array<Record<string, unknown>>;
    if (!rows.length) return defaultProducts;
    return rows.map((row) => ({
      id: String(row.id), label: String(row.label), title: String(row.title), description: String(row.description),
      url: String(row.url), buttonText: String(row.button_text), isActive: Boolean(row.is_active), sortOrder: Number(row.sort_order),
    }));
  } catch {
    return defaultProducts;
  }
}

export async function replaceProfileLinks(links: ProfileLink[]) {
  const db = getD1Binding();
  const now = Date.now();
  const statements = [db.prepare("DELETE FROM profile_links")];
  for (const link of links) {
    statements.push(db.prepare(
      "INSERT INTO profile_links (id, title, description, url, icon, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(link.id, link.title, link.description, link.url, link.icon, link.isActive ? 1 : 0, link.sortOrder, now, now));
  }
  await db.batch(statements);
}

export async function replaceProducts(products: Product[]) {
  const db = getD1Binding();
  const now = Date.now();
  const statements = [db.prepare("DELETE FROM products")];
  for (const product of products) {
    statements.push(db.prepare(
      "INSERT INTO products (id, label, title, description, url, button_text, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(product.id, product.label, product.title, product.description, product.url, product.buttonText, product.isActive ? 1 : 0, product.sortOrder, now, now));
  }
  await db.batch(statements);
}

export function parseLinks(value: unknown): ProfileLink[] | null {
  if (!Array.isArray(value) || value.length > 12) return null;
  const ids = new Set<string>();
  const parsed: ProfileLink[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const input = value[index] as Record<string, unknown>;
    const id = typeof input?.id === "string" && /^[a-z0-9-]{3,60}$/.test(input.id) ? input.id : "";
    const title = typeof input?.title === "string" ? input.title.trim() : "";
    const description = typeof input?.description === "string" ? input.description.trim() : "";
    const url = typeof input?.url === "string" ? input.url.trim() : "";
    if (!id || ids.has(id) || title.length < 2 || title.length > 80 || description.length > 180 || !isAllowedUrl(url)) return null;
    ids.add(id);
    parsed.push({ id, title, description, url, icon: parseIcon(input.icon), isActive: input.isActive !== false, sortOrder: index });
  }
  return parsed;
}

export function parseProducts(value: unknown): Product[] | null {
  if (!Array.isArray(value) || value.length > 4) return null;
  const parsed: Product[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const input = value[index] as Record<string, unknown>;
    const id = typeof input?.id === "string" && /^[a-z0-9-]{2,60}$/.test(input.id) ? input.id : "";
    const label = typeof input?.label === "string" ? input.label.trim() : "";
    const title = typeof input?.title === "string" ? input.title.trim() : "";
    const description = typeof input?.description === "string" ? input.description.trim() : "";
    const url = typeof input?.url === "string" ? input.url.trim() : "";
    const buttonText = typeof input?.buttonText === "string" ? input.buttonText.trim() : "";
    if (!id || label.length < 2 || label.length > 60 || title.length < 2 || title.length > 90 || description.length > 220 || buttonText.length < 2 || buttonText.length > 40 || !isAllowedUrl(url, false)) return null;
    parsed.push({ id, label, title, description, url, buttonText, isActive: input.isActive !== false, sortOrder: index });
  }
  return parsed;
}

function parseIcon(value: unknown): LinkIcon {
  return value === "code" || value === "workflow" || value === "briefcase" || value === "file" ? value : "link";
}
