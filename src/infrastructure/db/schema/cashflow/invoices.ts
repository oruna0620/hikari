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
import { estimates } from "../estimate/estimates";
import { users } from "../common/users";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  title: varchar("title", { length: 300 }),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("10.00"),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  paidAmount: numeric("paid_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  paymentStatus: varchar("payment_status", { length: 20 })
    .notNull()
    .default("unpaid"),
  sourceType: varchar("source_type", { length: 20 })
    .notNull()
    .default("manual"),
  createdBy: uuid("created_by").references(() => users.id),
  fileUrl: text("file_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
