import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { products } from "./products";

export const productSearchKeywords = pgTable("product_search_keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  keyword: varchar("keyword", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
