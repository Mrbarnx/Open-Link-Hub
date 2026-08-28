import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getCvContent } from "../../lib/cv-content";
import { getSiteSettings } from "../../lib/site-settings";
import { TrackedLink } from "../components/AnalyticsClient";
import { BrandIcon } from "../components/BrandIcon";
import { DownloadResumeButton } from "./DownloadResumeButton";

export const metadata = {
  title: "CV",
  description: "Professional experience, skills, projects and education.",
  alternates: { canonical: "/cv" },
};

export const dynamic = "force-dynamic";

export default async function CvPage() {
  const [settings, cv] = await Promise.all([getSiteSettings(), getCvContent()]);
  const contactLinks = [
    { label: "GitHub", href: settings.githubUrl, icon: <BrandIcon brand="github" size={19} /> },
    { label: "Email", href: `mailto:${settings.email}`, icon: <Mail size={19} strokeWidth={2} /> },
    { label: "WhatsApp", href: settings.whatsappUrl, icon: <BrandIcon brand="whatsapp" size={19} /> },
    { label: "TikTok", href: settings.tiktokUrl, icon: <BrandIcon brand="tiktok" size={19} /> },
    { label: "X", href: settings.xUrl, icon: <BrandIcon brand="x" size={19} /> },
  ];

  return (
    <main className={`cv-page theme-${settings.backgroundStyle} cards-${settings.cardStyle}`} style={{ "--blue": settings.accentColor } as CSSProperties}>
      <div className="cv-shell">
        <nav className="cv-nav">
          <Link href="/"><ArrowLeft size={16} /> Back to links</Link>
          <a href={`mailto:${settings.email}`}><Mail size={16} /> Contact</a>
        </nav>

        <header className="cv-header">
          <div className="profile-mark profile-photo cv-mark">
            {/* Dynamic admin-managed media intentionally bypasses the fixed Next image host allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.profileImageUrl} alt={settings.displayName} /><i />
          </div>
          <div className="cv-heading-copy">
            <p className="profile-kicker">Curriculum vitae</p>
            <h1>{settings.displayName}</h1>
            <h2>{settings.headline}</h2>
            <p>{cv.summary}</p>
          </div>
          {settings.resumeUrl ? <div className="cv-header-action"><DownloadResumeButton href={settings.resumeUrl} /></div> : null}
        </header>

        <section className="cv-section">
          <span className="cv-index">01 / PROFESSIONAL EXPERIENCE</span>
          {cv.experience.map((item) => (
            <article key={`${item.company}-${item.period}`}>
              <div><strong>{item.role} · {item.company}</strong><span>{item.period}{item.location ? ` · ${item.location}` : ""}</span></div>
              <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
            </article>
          ))}
        </section>

        <section className="cv-section">
          <span className="cv-index">02 / TECHNICAL SKILLS</span>
          <div className="cv-skill-groups">
            {cv.skills.map((group) => <div key={group.label}><h3>{group.label}</h3><div className="skill-cloud">{group.items.map((skill) => <span key={skill}>{skill}</span>)}</div></div>)}
          </div>
        </section>

        <section className="cv-section">
          <span className="cv-index">03 / SELECTED PROJECTS</span>
          {cv.projects.map((project) => (
            <article key={project.title}>
              <div><strong>{project.title}</strong>{project.url ? <TrackedLink href={project.url} target="_blank" rel="noreferrer" targetId={`cv-project:${project.title.toLowerCase().replaceAll(" ", "-")}`}>View project <ArrowUpRight size={14} /></TrackedLink> : null}</div>
              <small className="cv-stack">{project.stack}</small>
              <p>{project.description}</p>
            </article>
          ))}
        </section>

        <section className="cv-section">
          <span className="cv-index">04 / EDUCATION</span>
          {cv.education.map((item) => (
            <article key={`${item.institution}-${item.degree}`}>
              <div><strong>{item.degree}</strong><span>{item.period}</span></div>
              <p>{item.institution}{item.location ? ` · ${item.location}` : ""}</p>
            </article>
          ))}
        </section>

        <footer className="cv-contact" aria-labelledby="contact-footer-title">
          <div className="cv-contact-copy"><span>CONTACT FOOTER</span><h2 id="contact-footer-title">Let&apos;s connect</h2></div>
          <div className="cv-contact-links" aria-label="Contact links">
            {contactLinks.map((contact) => contact.href ? (
              <TrackedLink className="cv-contact-link" href={contact.href} key={contact.label} targetId={`cv:${contact.label.toLowerCase()}`} aria-label={contact.label} target={contact.href.startsWith("http") ? "_blank" : undefined} rel={contact.href.startsWith("http") ? "noreferrer" : undefined}>{contact.icon}<small>{contact.label}</small></TrackedLink>
            ) : (
              <span className="cv-contact-link cv-contact-pending" key={contact.label} aria-label={`${contact.label} link not configured`} title={`${contact.label} link will be added later`}>{contact.icon}<small>{contact.label}</small></span>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
