CREATE TABLE "registry_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registry_id" uuid NOT NULL,
	"saved_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_saves_registry_id_saved_by_user_id_unique" UNIQUE("registry_id","saved_by_user_id")
);
--> statement-breakpoint
ALTER TABLE "registry_saves" ADD CONSTRAINT "registry_saves_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;