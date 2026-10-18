import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { products } from "../common/products";
import { users } from "../common/users";
import { inventories } from "./inventories";

export const inventoryHistories = pgTable("inventory_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  inventoryId: uuid("inventory_id")
    .notNull()
    .references(() => inventories.id),
  type: varchar("type", { length: 10 }).notNull(),
  quantity: integer("quantity").notNull(),
  stockAfter: integer("stock_after").notNull(),
  operatedBy: uuid("operated_by")
    .notNull()
    .references(() => users.id),
  operatedAt: timestamp("operated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  notes: text("notes"),
  isCancelled: boolean("is_cancelled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
