import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  FileText,
  Link2,
  Mail,
  ShoppingBag,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { getProducts, getProfileLinks, type LinkIcon } from "../lib/content-data";
import { getSiteSettings } from "../lib/site-settings";
import { getPublicSiteUrl } from "../lib/runtime-env";
import { ViewTracker, TrackedLink } from "./components/AnalyticsClient";
import { BrandIcon } from "./components/BrandIcon";

const linkIcons = {
  code: Code2,
  workflow: Workflow,
  briefcase: BriefcaseBusiness,
  file: FileText,
  link: Link2,
} satisfies Record<LinkIcon, typeof Link2>;

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, links, products] = await Promise.all([
    getSiteSettings(),
    getProfileLinks(),
    getProducts(),
  ]);
  const socialLinks = [
    { icon: <BrandIcon brand="github" />, label: "GitHub", href: settings.githubUrl },
    { icon: <BrandIcon brand="linkedin" />, label: "LinkedIn", href: settings.linkedinUrl },
    { icon: <BrandIcon brand="x" />, label: "X", href: settings.xUrl },
    { icon: <BrandIcon brand="instagram" />, label: "Instagram", href: settings.instagramUrl },
    { icon: <BrandIcon brand="whatsapp" />, label: "WhatsApp", href: settings.whatsappUrl },
    { icon: <BrandIcon brand="tiktok" />, label: "TikTok", href: settings.tiktokUrl },
    { icon: <Mail size={21} strokeWidth={2} />, label: "Email", href: settings.email ? `mailto:${settings.email}` : "" },
  ];
  const activeLinks = links.filter((item) => item.isActive);
  const activeProducts = products.filter((item) => item.isActive);
  const pageStyle = { "--blue": settings.accentColor } as CSSProperties;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.displayName,
    url: getPublicSiteUrl(),
    jobTitle: settings.headline,
    ...(settings.email ? { email: `mailto:${settings.email}` } : {}),
    sameAs: [settings.githubUrl, settings.linkedinUrl, settings.xUrl, settings.instagramUrl, settings.tiktokUrl].filter(Boolean),
  };

  return (
    <main className={`link-page theme-${settings.backgroundStyle} cards-${settings.cardStyle}`} style={pageStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
      <ViewTracker />
      <div className="grid-glow grid-glow-one" aria-hidden="true" />
      <div className="grid-glow grid-glow-two" aria-hidden="true" />

      <div className="link-shell">
        <section className="profile-card" aria-labelledby="profile-name">
          <div className="profile-main">
            <div className="profile-mark profile-photo" aria-label={`${settings.displayName} profile photo`}>
              {/* Dynamic admin-managed media intentionally bypasses the fixed Next image host allowlist. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.profileImageUrl} alt={settings.displayName} />
              <i aria-hidden="true" />
            </div>
            <div className="profile-copy">
              <p className="profile-kicker">Hello, I&apos;m</p>
              <h1 id="profile-name">{settings.displayName}</h1>
              <p className="profile-role">{settings.headline}</p>
              <p className="profile-intro">{settings.intro}</p>
            </div>
            {settings.showCv ? <Link className="cv-button" href="/cv"><FileText size={17} /><span>View CV</span></Link> : null}
          </div>

          <div className="social-row social-row-wide" aria-label="Social profiles">
            {socialLinks.map((social) => social.href ? (
              <TrackedLink
                className="social-button"
                href={social.href}
                key={social.label}
                targetId={`social:${social.label.toLowerCase()}`}
                aria-label={social.label}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noreferrer" : undefined}
              >{social.icon}</TrackedLink>
            ) : (
              <span className="social-button social-pending" key={social.label} aria-label={`${social.label} link not configured`} title={`${social.label} can be connected in the dashboard`}>{social.icon}</span>
            ))}
          </div>
        </section>

        <section className="content-section" aria-labelledby="links-heading">
          <div className="section-title-row"><div><span>01</span><h2 id="links-heading">Important links</h2></div><p>Explore and connect</p></div>
          <div className="link-list">
            {activeLinks.map((item) => {
              const Icon = linkIcons[item.icon];
              return (
                <TrackedLink className="link-card" href={item.url} key={item.id} targetId={`link:${item.id}`} target={item.url.startsWith("http") ? "_blank" : undefined} rel={item.url.startsWith("http") ? "noreferrer" : undefined}>
                  <span className="card-icon"><Icon size={21} strokeWidth={1.8} /></span>
                  <span className="card-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
                  <span className="card-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
                </TrackedLink>
              );
            })}
            {!activeLinks.length ? <div className="public-empty-card">No public links yet.</div> : null}
          </div>
        </section>

        {activeProducts.length ? (
          <section className="content-section product-section" aria-labelledby="product-heading">
            <div className="section-title-row"><div><span>02</span><h2 id="product-heading">Product</h2></div><p>Built by {settings.displayName.split(" ")[0]}</p></div>
            <div className="product-list">
              {activeProducts.map((product) => (
                <TrackedLink className="product-card" href={product.url} key={product.id} targetId={`product:${product.id}`} target="_blank" rel="noreferrer">
                  <div className="product-visual" aria-hidden="true"><span>{product.title.charAt(0).toUpperCase()}</span><i /><i /><i /></div>
                  <div className="product-copy"><span className="product-label"><ShoppingBag size={13} /> {product.label}</span><h3>{product.title}</h3><p>{product.description}</p><span className="product-action">{product.buttonText} <ArrowUpRight size={16} /></span></div>
                </TrackedLink>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="minimal-footer"><span>© {new Date().getFullYear()} {settings.displayName}</span><span>{settings.location}</span></footer>
      </div>
    </main>
  );
}
