import {
  pgTable,
  uuid,
  date,
  numeric,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { customers } from "../common/customers";
import { invoices } from "./invoices";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  expectedDate: date("expected_date"),
  expectedAmount: numeric("expected_amount", { precision: 14, scale: 2 }),
  actualDate: date("actual_date"),
  actualAmount: numeric("actual_amount", { precision: 14, scale: 2 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
