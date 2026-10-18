"use server";

import { revalidatePath } from "next/cache";
import { repositories } from "@/lib/di/container";
import type { Customer } from "@/domain/common/entities/customer";

export async function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">
) {
  await repositories.customer.create(data);
  revalidatePath("/customers");
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  await repositories.customer.update(id, data);
  revalidatePath("/customers");
}

export async function deleteCustomer(id: string) {
  await repositories.customer.softDelete(id);
  revalidatePath("/customers");
}
