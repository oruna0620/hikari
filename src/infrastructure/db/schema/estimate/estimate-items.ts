import {
  pgTable,
  uuid,
  integer,
  varchar,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { products } from "../common/products";
import { estimates } from "./estimates";

export const estimateItems = pgTable("estimate_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id),
  sortOrder: integer("sort_order").notNull().default(0),
  productId: uuid("product_id").references(() => products.id),
  itemName: varchar("item_name", { length: 300 }).notNull(),
  modelNumber: varchar("model_number", { length: 100 }),
  quantity: numeric("quantity", { precision: 10, scale: 2 })
    .notNull()
    .default("1"),
  unit: varchar("unit", { length: 20 }).notNull().default("個"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  amount: numeric("amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
