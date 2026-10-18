import { eq, ilike, or, and } from "drizzle-orm";
import type { Database } from "../../db/client";
import { products } from "../../db/schema";
import type { Product } from "@/domain/common/entities/product";
import type { IProductRepository } from "@/domain/common/repositories/product-repository";

export class DrizzleProductRepository implements IProductRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.isDeleted, false));
    return rows as Product[];
  }

  async findById(id: string): Promise<Product | null> {
    const rows = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isDeleted, false)));
    return (rows[0] as Product) ?? null;
  }

  async search(query: string): Promise<Product[]> {
    const pattern = `%${query}%`;
    const rows = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isDeleted, false),
          or(
            ilike(products.name, pattern),
            ilike(products.productCode, pattern),
            ilike(products.modelNumber, pattern),
            ilike(products.manufacturer, pattern)
          )
        )
      );
    return rows as Product[];
  }

  async create(
    data: Omit<Product, "id" | "createdAt" | "updatedAt" | "isDeleted">
  ): Promise<Product> {
    const rows = await this.db.insert(products).values(data).returning();
    return rows[0] as Product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const { id: _, createdAt: __, updatedAt: ___, ...updateData } = data;
    const rows = await this.db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return (rows[0] as Product) ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(products)
      .set({ isDeleted: true })
      .where(eq(products.id, id));
  }
}
