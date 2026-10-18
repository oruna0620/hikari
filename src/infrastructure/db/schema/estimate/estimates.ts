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
import { users } from "../common/users";
import { uploadedDocuments } from "./uploaded-documents";

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateNumber: varchar("estimate_number", { length: 50 }).notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: varchar("customer_name", { length: 200 }),
  title: varchar("title", { length: 300 }),
  issueDate: date("issue_date").notNull().defaultNow(),
  expiryDate: date("expiry_date"),
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
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  sourceType: varchar("source_type", { length: 20 })
    .notNull()
    .default("manual"),
  uploadedDocumentId: uuid("uploaded_document_id").references(
    () => uploadedDocuments.id
  ),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
