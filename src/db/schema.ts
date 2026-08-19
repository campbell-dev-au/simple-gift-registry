import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const registries = pgTable("registries", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  eventDate: date("event_date"),
  // Free-form notes from the owner — shipping address, sizing, "no
  // gift-wrap please", etc. Shown to anyone with the share link, not just
  // the owner/co-owners.
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  // The public, unguessable identifier for /share/[shareToken] — separate
  // from `id` so a leaked link can be invalidated (regenerate) without
  // touching the registry's real identifier or any FKs pointing at it.
  shareToken: uuid("share_token").notNull().defaultRandom().unique(),
  // Off by default: an owner/co-owner managing the registry is very often
  // also a recipient (a wedding couple, a birthday person), so claim status
  // stays hidden from them unless they explicitly opt in — see
  // setClaimVisibility in registries/[id]/actions.ts, which requires the
  // opt-in to go through a confirmation step. Guests always see remaining
  // counts via /share/[token]; this only gates the owner-facing view.
  revealClaims: boolean("reveal_claims").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  registryId: uuid("registry_id")
    .notNull()
    .references(() => registries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  notes: text("notes"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per guest's claim on a gift, letting several guests split a
// gift's quantity between them (e.g. 2 of 5 blankets) instead of one
// claimant taking the whole thing. Claiming requires a Clerk account
// (claimedByUserId is a real, verified identity) so only the claimant can
// unclaim, and so other guests can be shown a remaining count without
// being told by whom.
export const giftClaims = pgTable("gift_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftId: uuid("gift_id")
    .notNull()
    .references(() => gifts.id, { onDelete: "cascade" }),
  claimedByUserId: text("claimed_by_user_id").notNull(),
  quantity: integer("quantity").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// An invitation to co-manage a registry, identified by email rather than a
// Clerk user id up front — the invited person may not have an account yet.
// The same row tracks the whole lifecycle (pending → accepted/declined)
// instead of a separate membership table: once accepted, this row *is* the
// co-owner record (acceptedByUserId identifies them). Matched against a
// signed-in user's verified email addresses — see
// docs/stories/invite-co-owner.md for why sending the invite email itself
// was deliberately left out of this pass.
export const registryInvitations = pgTable("registry_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  registryId: uuid("registry_id")
    .notNull()
    .references(() => registries.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  invitedByUserId: text("invited_by_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  acceptedByUserId: text("accepted_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

// A guest's bookmark on a registry they were shared a link to, so it shows
// up in their "My registries" list once they're signed in. Deliberately
// separate from registryInvitations: a save grants no management rights —
// viewing and claiming still go through the public /share/[token] link like
// any other guest, this just remembers which links to come back to.
export const registrySaves = pgTable(
  "registry_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registryId: uuid("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    savedByUserId: text("saved_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.registryId, table.savedByUserId)],
);
