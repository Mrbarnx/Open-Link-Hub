import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
  key: text("setting_key").primaryKey(),
  value: text("setting_value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const adminLoginAttempts = sqliteTable("admin_login_attempts", {
  rateKey: text("rate_key").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  windowStarted: integer("window_started").notNull(),
  blockedUntil: integer("blocked_until").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const profileLinks = sqliteTable("profile_links", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull().default("link"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  buttonText: text("button_text").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    targetId: text("target_id"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("analytics_event_type_idx").on(table.eventType),
    index("analytics_created_at_idx").on(table.createdAt),
  ],
);
