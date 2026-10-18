import type { Customer } from "../entities/customer";

export interface ICustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  create(
    data: Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">
  ): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer | null>;
  softDelete(id: string): Promise<void>;
}
