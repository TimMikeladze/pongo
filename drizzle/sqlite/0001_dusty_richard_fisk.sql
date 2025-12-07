CREATE TABLE `pongo_alert_events` (
	`id` text PRIMARY KEY NOT NULL,
	`alert_id` text NOT NULL,
	`monitor_id` text NOT NULL,
	`event_type` text NOT NULL,
	`triggered_at` integer NOT NULL,
	`resolved_at` integer,
	`snapshot` text,
	`trigger_check_id` text,
	`resolve_check_id` text
);
--> statement-breakpoint
CREATE TABLE `pongo_alert_state` (
	`alert_id` text PRIMARY KEY NOT NULL,
	`monitor_id` text NOT NULL,
	`status` text DEFAULT 'ok' NOT NULL,
	`last_fired_at` integer,
	`last_resolved_at` integer,
	`current_event_id` text,
	`updated_at` integer NOT NULL
);
