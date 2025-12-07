CREATE TABLE `pongo_alert_events` (
	`id` text PRIMARY KEY NOT NULL,
	`alert_id` text NOT NULL,
	`monitor_id` text NOT NULL,
	`region` text DEFAULT 'default' NOT NULL,
	`event_type` text NOT NULL,
	`triggered_at` integer NOT NULL,
	`resolved_at` integer,
	`snapshot` text,
	`trigger_check_id` text,
	`resolve_check_id` text
);
--> statement-breakpoint
CREATE TABLE `pongo_alert_overrides` (
	`alert_id` text PRIMARY KEY NOT NULL,
	`silenced_until` integer,
	`disabled` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pongo_alert_state` (
	`alert_id` text NOT NULL,
	`monitor_id` text NOT NULL,
	`region` text DEFAULT 'default' NOT NULL,
	`status` text DEFAULT 'ok' NOT NULL,
	`last_fired_at` integer,
	`last_resolved_at` integer,
	`last_notified_at` integer,
	`current_event_id` text,
	`state_changes` integer DEFAULT 0 NOT NULL,
	`flap_window_start` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`alert_id`, `region`)
);
--> statement-breakpoint
CREATE TABLE `pongo_check_results` (
	`id` text PRIMARY KEY NOT NULL,
	`monitor_id` text NOT NULL,
	`status` text NOT NULL,
	`response_time_ms` real NOT NULL,
	`status_code` integer,
	`message` text,
	`region` text DEFAULT 'default' NOT NULL,
	`checked_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`archived_at` integer
);
