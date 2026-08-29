import type { Metadata } from "next";
import { getPublicSiteUrl } from "../lib/runtime-env";
import { getSiteSettings } from "../lib/site-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getPublicSiteUrl();
  const settings = await getSiteSettings();
  const title = "Open Link Hub — Links, Work & Products";
  const description = "A customizable link-in-bio, portfolio, CV and product showcase.";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s | Open Link Hub" },
    description,
    applicationName: "Open Link Hub",
    alternates: { canonical: "/" },
    keywords: ["link in bio", "portfolio", "digital products", "creator links", "resume"],
    openGraph: { type: "website", url: "/", siteName: "Open Link Hub", title, description },
    twitter: { card: "summary", title, description },
    icons: { icon: settings.faviconUrl, shortcut: settings.faviconUrl, apple: settings.faviconUrl },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
