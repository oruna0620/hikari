import type { Product } from "../entities/product";

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  search(query: string): Promise<Product[]>;
  create(
    data: Omit<Product, "id" | "createdAt" | "updatedAt" | "isDeleted">
  ): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product | null>;
  softDelete(id: string): Promise<void>;
}
