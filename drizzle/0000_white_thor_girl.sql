CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"resource" text,
	"action" text,
	"details" jsonb,
	"success" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "item_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"multimedia_url" text,
	"collection_id" text,
	"attributes" jsonb,
	"rarity" text,
	"color" text,
	"pool" text DEFAULT 'default',
	"spawn_weight" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "minted_items" (
	"id" text PRIMARY KEY NOT NULL,
	"origin" text NOT NULL,
	"collection_id" text,
	"template_id" text,
	"minted_to_user_id" text,
	"minted_to_handle" text,
	"item_name" text NOT NULL,
	"rarity" text,
	"image_url" text,
	"multimedia_url" text,
	"payment_id" text,
	"minted_at" timestamp DEFAULT now(),
	"metadata" jsonb,
	CONSTRAINT "minted_items_origin_unique" UNIQUE("origin")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_request_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"currency" text NOT NULL,
	"paid_by" text,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1,
	"window_start" timestamp DEFAULT now(),
	"window_ms" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"last_activity_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"email" text,
	"first_seen_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now(),
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "item_templates" ADD CONSTRAINT "item_templates_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minted_items" ADD CONSTRAINT "minted_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minted_items" ADD CONSTRAINT "minted_items_template_id_item_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."item_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minted_items" ADD CONSTRAINT "minted_items_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;