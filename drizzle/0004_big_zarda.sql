ALTER TABLE "gifts" ADD COLUMN "claimed_by_name" text;--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "registries" ADD COLUMN "share_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "registries" ADD CONSTRAINT "registries_share_token_unique" UNIQUE("share_token");