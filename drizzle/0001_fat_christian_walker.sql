CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registry_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;