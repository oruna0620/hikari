import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  fax: varchar("fax", { length: 20 }),
  email: varchar("email", { length: 200 }),
  registrationNumber: varchar("registration_number", { length: 50 }),
  logoUrl: text("logo_url"),
  bankInfo: text("bank_info"),
  estimateNotes: text("estimate_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
