CREATE TABLE `admin_login_attempts` (
	`rate_key` text PRIMARY KEY NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`window_started` integer NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`setting_key` text PRIMARY KEY NOT NULL,
	`setting_value` text NOT NULL,
	`updated_at` integer NOT NULL
);
