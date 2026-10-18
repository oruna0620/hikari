import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "../common/users";

export const uploadedDocuments = pgTable("uploaded_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 300 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 10 }).notNull(),
  aiRawResponse: jsonb("ai_raw_response"),
  aiExtractedData: jsonb("ai_extracted_data"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  documentType: varchar("document_type", { length: 20 }),
  estimateId: uuid("estimate_id"),
  invoiceId: uuid("invoice_id"),
  expenseId: uuid("expense_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
