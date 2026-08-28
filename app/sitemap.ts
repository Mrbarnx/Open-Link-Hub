import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "../lib/runtime-env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cv`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
