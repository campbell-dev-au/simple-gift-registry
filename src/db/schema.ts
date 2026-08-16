import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core";

export const registries = pgTable("registries", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  eventDate: date("event_date"),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
