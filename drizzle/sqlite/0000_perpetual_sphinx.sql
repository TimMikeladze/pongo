CREATE TABLE `pongo_check_results` (
	`id` text PRIMARY KEY NOT NULL,
	`monitor_id` text NOT NULL,
	`status` text NOT NULL,
	`response_time_ms` real NOT NULL,
	`status_code` integer,
	`message` text,
	`checked_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`archived_at` integer
);
