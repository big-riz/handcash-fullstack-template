CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"handle" text NOT NULL,
	"avatar_url" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;