import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const registries = pgTable("registries", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  eventDate: date("event_date"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  // The public, unguessable identifier for /share/[shareToken] — separate
  // from `id` so a leaked link can be invalidated (regenerate) without
  // touching the registry's real identifier or any FKs pointing at it.
  shareToken: uuid("share_token").notNull().defaultRandom().unique(),
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
  // Anonymous, trust-based claiming — no guest account required. Whoever
  // has the share link can claim or unclaim; claimedByName is just a name
  // they type in, not a verified identity.
  claimedByName: text("claimed_by_name"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
