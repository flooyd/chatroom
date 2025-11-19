CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"filename" text NOT NULL,
	"content" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "link_to_message" bigint;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;