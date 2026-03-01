CREATE TABLE "status_page_monitors" (
	"status_page_id" uuid NOT NULL,
	"monitor_id" uuid NOT NULL,
	"display_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "status_page_monitors_status_page_id_monitor_id_pk" PRIMARY KEY("status_page_id","monitor_id")
);
--> statement-breakpoint
CREATE TABLE "status_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"custom_domain" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"show_overall_uptime" boolean DEFAULT true NOT NULL,
	"show_incident_history" boolean DEFAULT true NOT NULL,
	"logo_url" text,
	"brand_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "status_pages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "status_pages_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
ALTER TABLE "status_page_monitors" ADD CONSTRAINT "status_page_monitors_status_page_id_status_pages_id_fk" FOREIGN KEY ("status_page_id") REFERENCES "public"."status_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_page_monitors" ADD CONSTRAINT "status_page_monitors_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_pages" ADD CONSTRAINT "status_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "status_pages_user_id_idx" ON "status_pages" USING btree ("user_id");