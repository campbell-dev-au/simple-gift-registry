CREATE TABLE "gift_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid NOT NULL,
	"claimed_by_user_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gift_claims" ADD CONSTRAINT "gift_claims_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "gift_claims" ("gift_id", "claimed_by_user_id", "quantity", "claimed_at")
SELECT "id", "claimed_by_user_id", "quantity", "claimed_at" FROM "gifts" WHERE "claimed_by_user_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "gifts" DROP COLUMN "claimed_by_user_id";--> statement-breakpoint
ALTER TABLE "gifts" DROP COLUMN "claimed_at";