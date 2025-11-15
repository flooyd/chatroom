CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"text" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"profile_picture_url" text
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_picture_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_online_time" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");