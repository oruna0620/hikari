import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { lineUserMappings } from "../../db/schema";
import type { LineUserMapping } from "@/domain/common/entities/line-user-mapping";

export class DrizzleLineUserMappingRepository {
  constructor(private db: Database) {}

  async findByLineUserId(lineUserId: string): Promise<LineUserMapping | null> {
    const rows = await this.db
      .select()
      .from(lineUserMappings)
      .where(eq(lineUserMappings.lineUserId, lineUserId));
    return (rows[0] as LineUserMapping) ?? null;
  }

  async findByUserId(userId: string): Promise<LineUserMapping | null> {
    const rows = await this.db
      .select()
      .from(lineUserMappings)
      .where(eq(lineUserMappings.userId, userId));
    return (rows[0] as LineUserMapping) ?? null;
  }

  async upsert(data: {
    lineUserId: string;
    userId: string;
    displayName?: string | null;
    pictureUrl?: string | null;
  }): Promise<LineUserMapping> {
    const existing = await this.findByLineUserId(data.lineUserId);
    if (existing) {
      const rows = await this.db
        .update(lineUserMappings)
        .set({
          userId: data.userId,
          displayName: data.displayName ?? existing.displayName,
          pictureUrl: data.pictureUrl ?? existing.pictureUrl,
          updatedAt: new Date(),
        })
        .where(eq(lineUserMappings.lineUserId, data.lineUserId))
        .returning();
      return rows[0] as LineUserMapping;
    }

    const rows = await this.db
      .insert(lineUserMappings)
      .values({
        lineUserId: data.lineUserId,
        userId: data.userId,
        displayName: data.displayName ?? null,
        pictureUrl: data.pictureUrl ?? null,
      })
      .returning();
    return rows[0] as LineUserMapping;
  }
}
