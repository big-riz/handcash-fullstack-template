CREATE TABLE "replays" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"player_name" text NOT NULL,
	"handle" text,
	"avatar_url" text,
	"seed" text NOT NULL,
	"events" jsonb NOT NULL,
	"final_level" integer NOT NULL,
	"final_time" integer NOT NULL,
	"game_version" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "replays" ADD CONSTRAINT "replays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;