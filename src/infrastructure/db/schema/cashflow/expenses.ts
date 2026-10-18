import {
  pgTable,
  uuid,
  varchar,
  date,
  numeric,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { customers } from "../common/customers";

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  payeeName: varchar("payee_name", { length: 200 }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  category: varchar("category", { length: 100 }),
  title: varchar("title", { length: 300 }),
  expectedDate: date("expected_date"),
  expectedAmount: numeric("expected_amount", { precision: 14, scale: 2 }),
  actualDate: date("actual_date"),
  actualAmount: numeric("actual_amount", { precision: 14, scale: 2 }),
  paymentStatus: varchar("payment_status", { length: 20 })
    .notNull()
    .default("unpaid"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  fileUrl: text("file_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
