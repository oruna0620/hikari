import { eq, and } from "drizzle-orm";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";
import type { User } from "@/domain/common/entities/user";
import type { IUserRepository } from "@/domain/common/repositories/user-repository";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<User[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    return rows as User[];
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)));
    return (rows[0] as User) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return (rows[0] as User) ?? null;
  }

  async create(
    data: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const rows = await this.db.insert(users).values(data).returning();
    return rows[0] as User;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const { id: _, createdAt: __, updatedAt: ___, ...updateData } = data;
    const rows = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return (rows[0] as User) ?? null;
  }
}
