import {
  pgTable,
  uuid,
  varchar,
  numeric,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  productCode: varchar("product_code", { length: 50 }).unique(),
  name: varchar("name", { length: 300 }).notNull(),
  modelNumber: varchar("model_number", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 200 }),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  unit: varchar("unit", { length: 20 }).notNull().default("個"),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
