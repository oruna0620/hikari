import { eq, and } from "drizzle-orm";
import type { Database } from "../../db/client";
import { customers } from "../../db/schema";
import type { Customer } from "@/domain/common/entities/customer";
import type { ICustomerRepository } from "@/domain/common/repositories/customer-repository";

export class DrizzleCustomerRepository implements ICustomerRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Customer[]> {
    const rows = await this.db
      .select()
      .from(customers)
      .where(eq(customers.isDeleted, false));
    return rows as Customer[];
  }

  async findById(id: string): Promise<Customer | null> {
    const rows = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.isDeleted, false)));
    return (rows[0] as Customer) ?? null;
  }

  async create(
    data: Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">
  ): Promise<Customer> {
    const rows = await this.db.insert(customers).values(data).returning();
    return rows[0] as Customer;
  }

  async update(
    id: string,
    data: Partial<Customer>
  ): Promise<Customer | null> {
    const { id: _, createdAt: __, updatedAt: ___, ...updateData } = data;
    const rows = await this.db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return (rows[0] as Customer) ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(customers)
      .set({ isDeleted: true })
      .where(eq(customers.id, id));
  }
}
