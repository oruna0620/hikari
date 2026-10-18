import type { Invoice } from "../entities/invoice";

export interface IInvoiceRepository {
  findAll(): Promise<Invoice[]>;
  findById(id: string): Promise<Invoice | null>;
  create(
    data: Omit<Invoice, "id" | "createdAt" | "updatedAt">
  ): Promise<Invoice>;
  update(id: string, data: Partial<Invoice>): Promise<Invoice | null>;
}
