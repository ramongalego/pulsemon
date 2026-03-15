ALTER TYPE "public"."ping_status" ADD VALUE 'start';--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "last_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "is_running" boolean DEFAULT false NOT NULL;