"use client";

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Link2,
  LogOut,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AnalyticsSummary } from "../../lib/analytics";
import type { Product, ProfileLink } from "../../lib/content-data";
import type { CvContent, CvEducation, CvExperience, CvProject, CvSkillGroup } from "../../lib/cv-content";
import type { AccentColor, BackgroundStyle, CardStyle, SiteSettings } from "../../lib/site-settings";

type Tab = "overview" | "profile" | "links" | "product" | "cv" | "appearance" | "analytics";

type Props = {
  initialSettings: SiteSettings;
  initialLinks: ProfileLink[];
  initialProducts: Product[];
  initialCv: CvContent;
  analytics: AnalyticsSummary;
  username: string;
};

const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "profile" as const, label: "Profile & socials", icon: UserRound },
  { id: "links" as const, label: "Links", icon: Link2 },
  { id: "product" as const, label: "Product", icon: ShoppingBag },
  { id: "cv" as const, label: "CV & résumé", icon: FileText },
  { id: "appearance" as const, label: "Appearance", icon: Palette },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
];

const accentOptions: Array<{ value: AccentColor; label: string }> = [
  { value: "#2563eb", label: "Electric blue" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#0f766e", label: "Teal" },
  { value: "#ea580c", label: "Orange" },
];

export function AdminDashboard({ initialSettings, initialLinks, initialProducts, initialCv, analytics, username }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [settings, setSettings] = useState(initialSettings);
  const [links, setLinks] = useState(initialLinks);
  const [products, setProducts] = useState(initialProducts);
  const [cv, setCv] = useState(initialCv);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"profile" | "resume" | "">("");

  function setSetting<K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updateLink(index: number, field: keyof ProfileLink, value: string | boolean) {
    setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function moveLink(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= links.length) return;
    setLinks((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next.map((item, order) => ({ ...item, sortOrder: order }));
    });
  }

  function addLink() {
    if (links.length >= 12) return;
    setLinks((current) => [...current, {
      id: `link-${Date.now().toString(36)}`,
      title: "New link",
      description: "Add a short description.",
      url: "https://",
      icon: "link",
      isActive: true,
      sortOrder: current.length,
    }]);
  }

  function updateProduct(index: number, field: keyof Product, value: string | boolean) {
    setProducts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function updateSkill(index: number, patch: Partial<CvSkillGroup>) {
    setCv((current) => ({ ...current, skills: current.skills.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function updateExperience(index: number, patch: Partial<CvExperience>) {
    setCv((current) => ({ ...current, experience: current.experience.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function updateProject(index: number, patch: Partial<CvProject>) {
    setCv((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function updateEducation(index: number, patch: Partial<CvEducation>) {
    setCv((current) => ({ ...current, education: current.education.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  async function uploadMedia(kind: "profile" | "resume", file?: File) {
    if (!file) return;
    setUploading(kind);
    setStatus("");
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = (await response.json()) as { message?: string; url?: string };
      if (!response.ok || !result.url) {
        setStatus(result.message ?? "The upload could not be completed.");
      } else {
        setSetting(kind === "profile" ? "profileImageUrl" : "resumeUrl", result.url);
        setStatus(`${kind === "profile" ? "Profile photo" : "Résumé PDF"} uploaded. Save changes to keep this version.`);
      }
    } catch {
      setStatus("The upload could not be completed.");
    } finally {
      setUploading("");
    }
  }

  async function saveAll() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings, links, products, cv }),
      });
      const result = (await response.json()) as { message?: string };
      setStatus(response.ok ? "All changes are saved and live." : result.message ?? "Could not save changes.");
    } catch {
      setStatus("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  const maxDaily = Math.max(1, ...analytics.last7Days.map((day) => Math.max(day.views, day.clicks)));

  return (
    <main className="admin-page">
      <div className="admin-shell admin-shell-wide">
        <header className="admin-header">
          <div>
            <p className="profile-kicker">Open Link Hub</p>
            <h1>Admin dashboard</h1>
            <span>Signed in as {username}</span>
          </div>
          <div className="admin-actions">
            <Link href="/" target="_blank" rel="noreferrer">View site <ExternalLink size={14} /></Link>
            <button type="button" onClick={logout}><LogOut size={14} /> Log out</button>
          </div>
        </header>

        <section className="admin-security-card">
          <span><ShieldCheck size={20} /></span>
          <div><strong>Security is active</strong><p>Protected credentials, signed 12-hour sessions and persistent login throttling.</p></div>
        </section>

        <div className="admin-workspace">
          <aside className="admin-sidebar" aria-label="Dashboard sections">
            {navigation.map((item) => {
              const Icon = item.icon;
              return <button className={activeTab === item.id ? "active" : ""} type="button" key={item.id} onClick={() => setActiveTab(item.id)}><Icon size={16} /> {item.label}</button>;
            })}
          </aside>

          <section className="admin-panel">
            <div className="admin-panel-topbar">
              <div><span>{activeTab.toUpperCase()}</span><h2>{navigation.find((item) => item.id === activeTab)?.label}</h2></div>
              {activeTab !== "analytics" && activeTab !== "overview" ? <button className="admin-save-button" type="button" onClick={saveAll} disabled={saving}><Save size={15} /> {saving ? "Saving…" : "Save changes"}</button> : null}
            </div>
            {status ? <p className="admin-global-status" aria-live="polite">{status}</p> : null}

            {activeTab === "overview" ? (
              <div className="admin-tab-content">
                <div className="admin-metric-grid">
                  <Metric label="Total views" value={analytics.totalViews} />
                  <Metric label="Link clicks" value={analytics.totalClicks} />
                  <Metric label="Click rate" value={`${analytics.clickThroughRate}%`} />
                  <Metric label="Active links" value={links.filter((item) => item.isActive).length} />
                </div>
                <div className="admin-overview-grid">
                  <article className="admin-info-card"><span>PROFILE</span><h3>{settings.displayName}</h3><p>{settings.headline}</p><button type="button" onClick={() => setActiveTab("profile")}>Edit profile</button></article>
                  <article className="admin-info-card"><span>STORE</span><h3>{products[0]?.title ?? "No product"}</h3><p>{products[0]?.isActive ? "Visible on your page" : "Currently hidden"}</p><button type="button" onClick={() => setActiveTab("product")}>Manage product</button></article>
                  <article className="admin-info-card"><span>APPEARANCE</span><h3>{settings.backgroundStyle === "grid" ? "Technical grid" : settings.backgroundStyle}</h3><p>Accent {settings.accentColor}</p><button type="button" onClick={() => setActiveTab("appearance")}>Customize design</button></article>
                </div>
              </div>
            ) : null}

            {activeTab === "profile" ? (
              <div className="admin-tab-content admin-form-stack">
                <div className="admin-field-grid two-columns">
                  <Field label="Display name" value={settings.displayName} onChange={(value) => setSetting("displayName", value)} />
                  <Field label="Professional headline" value={settings.headline} onChange={(value) => setSetting("headline", value)} />
                  <Field label="Email" type="email" value={settings.email} onChange={(value) => setSetting("email", value)} />
                  <Field label="Location" value={settings.location} onChange={(value) => setSetting("location", value)} />
                </div>
                <label className="admin-wide-field">Brief introduction<textarea value={settings.intro} onChange={(event) => setSetting("intro", event.target.value)} minLength={10} maxLength={240} rows={4} required /><small>{settings.intro.length} / 240 characters</small></label>
                <div className="admin-media-editor">
                  {/* Dynamic admin-managed media intentionally bypasses the fixed Next image host allowlist. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.profileImageUrl} alt="Current profile" />
                  <div>
                    <span>PROFILE PHOTO</span>
                    <p>Upload a JPG, PNG or WebP image. The square crop is handled automatically.</p>
                    <label className="admin-upload-button"><Upload size={14} /> {uploading === "profile" ? "Uploading…" : "Upload new photo"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploading)} onChange={(event) => uploadMedia("profile", event.target.files?.[0])} /></label>
                  </div>
                </div>
                <Field label="Profile image URL" value={settings.profileImageUrl} onChange={(value) => setSetting("profileImageUrl", value)} placeholder="/api/media/profile or https://..." />
                <div className="admin-subheading"><span>SOCIAL URLS</span><p>Leave a field empty to hide that icon.</p></div>
                <div className="admin-field-grid two-columns">
                  <Field label="GitHub URL" type="url" value={settings.githubUrl} onChange={(value) => setSetting("githubUrl", value)} />
                  <Field label="LinkedIn URL" type="url" value={settings.linkedinUrl} onChange={(value) => setSetting("linkedinUrl", value)} />
                  <Field label="X URL" type="url" value={settings.xUrl} onChange={(value) => setSetting("xUrl", value)} />
                  <Field label="Instagram URL" type="url" value={settings.instagramUrl} onChange={(value) => setSetting("instagramUrl", value)} />
                  <Field label="WhatsApp URL" type="url" value={settings.whatsappUrl} onChange={(value) => setSetting("whatsappUrl", value)} placeholder="https://wa.me/..." />
                  <Field label="TikTok URL" type="url" value={settings.tiktokUrl} onChange={(value) => setSetting("tiktokUrl", value)} />
                </div>
                <label className="admin-checkbox-row"><input type="checkbox" checked={settings.showCv} onChange={(event) => setSetting("showCv", event.target.checked)} /><span><strong>Show CV button</strong><small>Display the View CV action on the public profile.</small></span></label>
              </div>
            ) : null}

            {activeTab === "links" ? (
              <div className="admin-tab-content">
                <div className="admin-list-heading"><p>Add, reorder, hide or remove the cards shown under Important links.</p><button type="button" onClick={addLink} disabled={links.length >= 12}><Plus size={14} /> Add link</button></div>
                <div className="admin-link-editor-list">
                  {links.map((item, index) => (
                    <article className="admin-link-editor" key={item.id}>
                      <div className="admin-link-order"><button type="button" onClick={() => moveLink(index, -1)} disabled={index === 0} aria-label="Move link up"><ArrowUp size={14} /></button><button type="button" onClick={() => moveLink(index, 1)} disabled={index === links.length - 1} aria-label="Move link down"><ArrowDown size={14} /></button></div>
                      <div className="admin-link-fields">
                        <div className="admin-field-grid two-columns"><Field label="Title" value={item.title} onChange={(value) => updateLink(index, "title", value)} /><label>Icon<select value={item.icon} onChange={(event) => updateLink(index, "icon", event.target.value)}><option value="link">Link</option><option value="code">Code</option><option value="workflow">Automation</option><option value="briefcase">Work</option><option value="file">Document</option></select></label></div>
                        <Field label="Description" value={item.description} onChange={(value) => updateLink(index, "description", value)} />
                        <Field label="Destination URL" value={item.url} onChange={(value) => updateLink(index, "url", value)} placeholder="https:// or mailto:" />
                      </div>
                      <div className="admin-link-actions"><label><input type="checkbox" checked={item.isActive} onChange={(event) => updateLink(index, "isActive", event.target.checked)} /> Visible</label><button type="button" onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Delete link"><Trash2 size={15} /></button></div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "product" ? (
              <div className="admin-tab-content admin-form-stack">
                {products.map((product, index) => <article className="admin-product-editor" key={product.id}><div className="admin-field-grid two-columns"><Field label="Product title" value={product.title} onChange={(value) => updateProduct(index, "title", value)} /><Field label="Small label" value={product.label} onChange={(value) => updateProduct(index, "label", value)} /></div><label className="admin-wide-field">Description<textarea rows={3} value={product.description} onChange={(event) => updateProduct(index, "description", event.target.value)} /></label><div className="admin-field-grid two-columns"><Field label="Store URL" type="url" value={product.url} onChange={(value) => updateProduct(index, "url", value)} /><Field label="Button text" value={product.buttonText} onChange={(value) => updateProduct(index, "buttonText", value)} /></div><label className="admin-checkbox-row"><input type="checkbox" checked={product.isActive} onChange={(event) => updateProduct(index, "isActive", event.target.checked)} /><span><strong>Show this product</strong><small>Hide it without deleting its details.</small></span></label></article>)}
              </div>
            ) : null}

            {activeTab === "cv" ? (
              <div className="admin-tab-content admin-form-stack">
                <div className="admin-media-editor admin-resume-editor">
                  <span className="admin-media-icon"><FileText size={24} /></span>
                  <div>
                    <span>ATS RÉSUMÉ PDF</span>
                    <p>Visitors receive this file from the Download résumé button.</p>
                    <label className="admin-upload-button"><Upload size={14} /> {uploading === "resume" ? "Uploading…" : "Replace résumé PDF"}<input type="file" accept="application/pdf" disabled={Boolean(uploading)} onChange={(event) => uploadMedia("resume", event.target.files?.[0])} /></label>
                  </div>
                </div>
                <Field label="Résumé download URL" value={settings.resumeUrl} onChange={(value) => setSetting("resumeUrl", value)} placeholder="/api/media/resume or https://..." />

                <div className="admin-subheading"><span>PROFESSIONAL SUMMARY</span><p>This content also appears on the designed CV page.</p></div>
                <label className="admin-wide-field">Summary<textarea rows={6} value={cv.summary} onChange={(event) => setCv((current) => ({ ...current, summary: event.target.value }))} /></label>

                <EditorHeading title="Technical skills" note="Enter one skill per line." onAdd={() => setCv((current) => ({ ...current, skills: [...current.skills, { label: "New skill group", items: ["New skill"] }] }))} disabled={cv.skills.length >= 8} />
                <div className="admin-cv-list">
                  {cv.skills.map((group, index) => (
                    <article className="admin-cv-editor" key={`${group.label}-${index}`}>
                      <div className="admin-editor-title"><strong>Skill group {index + 1}</strong><button type="button" disabled={cv.skills.length === 1} onClick={() => setCv((current) => ({ ...current, skills: current.skills.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /></button></div>
                      <Field label="Group name" value={group.label} onChange={(value) => updateSkill(index, { label: value })} />
                      <label>Skills<textarea rows={4} value={group.items.join("\n")} onChange={(event) => updateSkill(index, { items: lines(event.target.value) })} /></label>
                    </article>
                  ))}
                </div>

                <EditorHeading title="Professional experience" note="Roles are displayed in this order." onAdd={() => setCv((current) => ({ ...current, experience: [...current.experience, { role: "New role", company: "Company", location: "", period: "Period", bullets: ["Add an achievement."] }] }))} disabled={cv.experience.length >= 10} />
                <div className="admin-cv-list">
                  {cv.experience.map((item, index) => (
                    <article className="admin-cv-editor" key={`${item.company}-${index}`}>
                      <div className="admin-editor-title"><strong>Experience {index + 1}</strong><button type="button" disabled={cv.experience.length === 1} onClick={() => setCv((current) => ({ ...current, experience: current.experience.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /></button></div>
                      <div className="admin-field-grid two-columns"><Field label="Role" value={item.role} onChange={(value) => updateExperience(index, { role: value })} /><Field label="Company" value={item.company} onChange={(value) => updateExperience(index, { company: value })} /><Field label="Location" value={item.location} onChange={(value) => updateExperience(index, { location: value })} /><Field label="Period" value={item.period} onChange={(value) => updateExperience(index, { period: value })} /></div>
                      <label>Achievements - one per line<textarea rows={6} value={item.bullets.join("\n")} onChange={(event) => updateExperience(index, { bullets: lines(event.target.value) })} /></label>
                    </article>
                  ))}
                </div>

                <EditorHeading title="Selected projects" note="Add a secure HTTPS project link." onAdd={() => setCv((current) => ({ ...current, projects: [...current.projects, { title: "New project", stack: "Technology stack", description: "Describe the project and its value.", url: "https://" }] }))} disabled={cv.projects.length >= 8} />
                <div className="admin-cv-list">
                  {cv.projects.map((item, index) => (
                    <article className="admin-cv-editor" key={`${item.title}-${index}`}>
                      <div className="admin-editor-title"><strong>Project {index + 1}</strong><button type="button" disabled={cv.projects.length === 1} onClick={() => setCv((current) => ({ ...current, projects: current.projects.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /></button></div>
                      <div className="admin-field-grid two-columns"><Field label="Project title" value={item.title} onChange={(value) => updateProject(index, { title: value })} /><Field label="Technology stack" value={item.stack} onChange={(value) => updateProject(index, { stack: value })} /></div>
                      <label>Description<textarea rows={4} value={item.description} onChange={(event) => updateProject(index, { description: event.target.value })} /></label>
                      <Field label="Project URL" type="url" value={item.url} onChange={(value) => updateProject(index, { url: value })} />
                    </article>
                  ))}
                </div>

                <EditorHeading title="Education" note="Keep the most relevant qualification first." onAdd={() => setCv((current) => ({ ...current, education: [...current.education, { degree: "Qualification", period: "Period", institution: "Institution", location: "" }] }))} disabled={cv.education.length >= 4} />
                <div className="admin-cv-list">
                  {cv.education.map((item, index) => (
                    <article className="admin-cv-editor" key={`${item.institution}-${index}`}>
                      <div className="admin-editor-title"><strong>Education {index + 1}</strong><button type="button" disabled={cv.education.length === 1} onClick={() => setCv((current) => ({ ...current, education: current.education.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /></button></div>
                      <div className="admin-field-grid two-columns"><Field label="Degree / qualification" value={item.degree} onChange={(value) => updateEducation(index, { degree: value })} /><Field label="Period" value={item.period} onChange={(value) => updateEducation(index, { period: value })} /><Field label="Institution" value={item.institution} onChange={(value) => updateEducation(index, { institution: value })} /><Field label="Location" value={item.location} onChange={(value) => updateEducation(index, { location: value })} /></div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "appearance" ? (
              <div className="admin-tab-content admin-form-stack">
                <div className="admin-option-section"><h3>Accent color</h3><p>Used for highlights, icons and focus states.</p><div className="admin-color-options">{accentOptions.map((option) => <button className={settings.accentColor === option.value ? "selected" : ""} style={{ "--swatch": option.value } as React.CSSProperties} type="button" key={option.value} onClick={() => setSetting("accentColor", option.value)}><i /> {option.label}</button>)}</div></div>
                <ChoiceGroup title="Background" value={settings.backgroundStyle} options={[{ value: "grid", label: "Technical grid", note: "Current premium grid" }, { value: "clean", label: "Clean white", note: "Minimal and distraction-free" }, { value: "soft", label: "Soft glow", note: "Subtle blue atmosphere" }]} onChange={(value) => setSetting("backgroundStyle", value as BackgroundStyle)} />
                <ChoiceGroup title="Card shape" value={settings.cardStyle} options={[{ value: "rounded", label: "Rounded", note: "Soft Apple-style corners" }, { value: "soft-square", label: "Soft square", note: "More technical and compact" }]} onChange={(value) => setSetting("cardStyle", value as CardStyle)} />
              </div>
            ) : null}

            {activeTab === "analytics" ? (
              <div className="admin-tab-content">
                <div className="admin-metric-grid three"><Metric label="Total views" value={analytics.totalViews} /><Metric label="Total clicks" value={analytics.totalClicks} /><Metric label="Click rate" value={`${analytics.clickThroughRate}%`} /></div>
                <article className="admin-chart-card"><div><span>LAST 7 DAYS</span><h3>Views and clicks</h3></div>{analytics.last7Days.length ? <div className="admin-bar-chart">{analytics.last7Days.map((day) => <div className="admin-bar-day" key={day.day}><div className="admin-bars"><i style={{ height: `${Math.max(4, (day.views / maxDaily) * 100)}%` }} title={`${day.views} views`} /><i style={{ height: `${Math.max(4, (day.clicks / maxDaily) * 100)}%` }} title={`${day.clicks} clicks`} /></div><small>{day.day.slice(5)}</small></div>)}</div> : <p className="admin-empty-state">Analytics will appear after people visit and click your links.</p>}</article>
                <article className="admin-top-links"><span>TOP TARGETS</span>{analytics.topTargets.length ? analytics.topTargets.map((target, index) => <div key={target.targetId}><strong>{index + 1}. {target.targetId}</strong><small>{target.clicks} clicks</small></div>) : <p className="admin-empty-state">No link clicks recorded yet.</p>}</article>
                <p className="admin-privacy-note">Privacy-friendly analytics: no visitor names, emails or IP addresses are stored.</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="admin-metric"><span>{label}</span><strong>{value}</strong></article>;
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label>{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ChoiceGroup({ title, value, options, onChange }: { title: string; value: string; options: Array<{ value: string; label: string; note: string }>; onChange: (value: string) => void }) {
  return <div className="admin-option-section"><h3>{title}</h3><div className="admin-choice-grid">{options.map((option) => <button className={value === option.value ? "selected" : ""} type="button" key={option.value} onClick={() => onChange(option.value)}><strong>{option.label}</strong><small>{option.note}</small></button>)}</div></div>;
}

function EditorHeading({ title, note, onAdd, disabled }: { title: string; note: string; onAdd: () => void; disabled?: boolean }) {
  return <div className="admin-list-heading admin-cv-heading"><div><strong>{title}</strong><p>{note}</p></div><button type="button" onClick={onAdd} disabled={disabled}><Plus size={14} /> Add</button></div>;
}

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}
