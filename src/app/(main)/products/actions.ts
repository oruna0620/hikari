"use server";

import { revalidatePath } from "next/cache";
import { repositories } from "@/lib/di/container";
import type { Product } from "@/domain/common/entities/product";

export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt" | "isDeleted">
) {
  await repositories.product.create(data);
  revalidatePath("/products");
}

export async function updateProduct(id: string, data: Partial<Product>) {
  await repositories.product.update(id, data);
  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  await repositories.product.softDelete(id);
  revalidatePath("/products");
}
