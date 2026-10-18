import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lineUserMappings = pgTable("line_user_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  lineUserId: varchar("line_user_id", { length: 100 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  displayName: varchar("display_name", { length: 200 }),
  pictureUrl: text("picture_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
