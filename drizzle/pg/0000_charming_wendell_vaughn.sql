CREATE TYPE "public"."alert_event_type" AS ENUM('fired', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('ok', 'firing');--> statement-breakpoint
CREATE TABLE "pongo_alert_events" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"monitor_id" text NOT NULL,
	"region" text DEFAULT 'default' NOT NULL,
	"event_type" "alert_event_type" NOT NULL,
	"triggered_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"snapshot" jsonb,
	"trigger_check_id" text,
	"resolve_check_id" text
);
--> statement-breakpoint
CREATE TABLE "pongo_alert_overrides" (
	"alert_id" text PRIMARY KEY NOT NULL,
	"silenced_until" timestamp,
	"disabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pongo_alert_state" (
	"alert_id" text NOT NULL,
	"monitor_id" text NOT NULL,
	"region" text DEFAULT 'default' NOT NULL,
	"status" "alert_status" DEFAULT 'ok' NOT NULL,
	"last_fired_at" timestamp,
	"last_resolved_at" timestamp,
	"last_notified_at" timestamp,
	"current_event_id" text,
	"state_changes" integer DEFAULT 0 NOT NULL,
	"flap_window_start" timestamp,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "pongo_alert_state_alert_id_region_pk" PRIMARY KEY("alert_id","region")
);
--> statement-breakpoint
CREATE TABLE "pongo_check_results" (
	"id" text PRIMARY KEY NOT NULL,
	"monitor_id" text NOT NULL,
	"status" text NOT NULL,
	"response_time_ms" double precision NOT NULL,
	"status_code" integer,
	"message" text,
	"region" text DEFAULT 'default' NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_pongo_alert_state_monitor_id" ON "pongo_alert_state" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_monitor_id" ON "pongo_check_results" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_checked_at" ON "pongo_check_results" USING btree ("checked_at");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_monitor_checked_at" ON "pongo_check_results" USING btree ("monitor_id","checked_at");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_status" ON "pongo_check_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_region" ON "pongo_check_results" USING btree ("region");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_monitor_region_checked_at" ON "pongo_check_results" USING btree ("monitor_id","region","checked_at");--> statement-breakpoint
CREATE INDEX "idx_pongo_check_results_archival" ON "pongo_check_results" USING btree ("checked_at") WHERE archived_at IS NULL;