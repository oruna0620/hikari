import type { User } from "../entities/user";

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(
    data: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}
