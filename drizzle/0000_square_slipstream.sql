CREATE TABLE "registries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"event_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
