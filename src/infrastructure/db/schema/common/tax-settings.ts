import {
  pgTable,
  uuid,
  numeric,
  varchar,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const taxSettings = pgTable("tax_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("10.00"),
  roundingMethod: varchar("rounding_method", { length: 10 })
    .notNull()
    .default("floor"),
  displayMode: varchar("display_mode", { length: 20 })
    .notNull()
    .default("exclusive"),
  effectiveFrom: date("effective_from").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
