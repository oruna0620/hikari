import type { Estimate } from "../entities/estimate";

export interface IEstimateRepository {
  findAll(): Promise<Estimate[]>;
  findById(id: string): Promise<Estimate | null>;
  create(
    data: Omit<Estimate, "id" | "createdAt" | "updatedAt">
  ): Promise<Estimate>;
  update(id: string, data: Partial<Estimate>): Promise<Estimate | null>;
}
