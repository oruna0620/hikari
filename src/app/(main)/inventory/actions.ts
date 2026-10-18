"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/infrastructure/db/client";
import {
  inventories,
  inventoryHistories,
  products,
  qrCodes,
} from "@/infrastructure/db/schema";
import { eq, desc } from "drizzle-orm";
import { repositories } from "@/lib/di/container";
import { getSession } from "@/lib/auth/session";
import type { StockMovementType } from "@/domain/inventory/value-objects/stock-movement-type";

export type InventoryWithProduct = {
  id: string;
  productId: string;
  productCode: string | null;
  productName: string;
  modelNumber: string | null;
  manufacturer: string | null;
  unitPrice: string;
  unit: string;
  category: string | null;
  currentStock: number;
  minimumStock: number;
  lastUpdatedAt: Date;
};

export async function getInventoryList(): Promise<InventoryWithProduct[]> {
  const rows = await db
    .select({
      id: inventories.id,
      productId: inventories.productId,
      productCode: products.productCode,
      productName: products.name,
      modelNumber: products.modelNumber,
      manufacturer: products.manufacturer,
      unitPrice: products.unitPrice,
      unit: products.unit,
      category: products.category,
      currentStock: inventories.currentStock,
      minimumStock: inventories.minimumStock,
      lastUpdatedAt: inventories.lastUpdatedAt,
    })
    .from(inventories)
    .innerJoin(products, eq(inventories.productId, products.id))
    .where(eq(products.isDeleted, false));

  return rows;
}

export type HistoryRow = {
  id: string;
  type: string;
  quantity: number;
  stockAfter: number;
  operatedAt: Date;
  operatorName: string | null;
  notes: string | null;
  isCancelled: boolean;
};

export async function getInventoryDetail(productId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  if (!product) return null;

  const [inventory] = await db
    .select()
    .from(inventories)
    .where(eq(inventories.productId, productId));

  const histories = await db
    .select({
      id: inventoryHistories.id,
      type: inventoryHistories.type,
      quantity: inventoryHistories.quantity,
      stockAfter: inventoryHistories.stockAfter,
      operatedAt: inventoryHistories.operatedAt,
      notes: inventoryHistories.notes,
      isCancelled: inventoryHistories.isCancelled,
    })
    .from(inventoryHistories)
    .where(eq(inventoryHistories.productId, productId))
    .orderBy(desc(inventoryHistories.operatedAt));

  return { product, inventory, histories };
}

export async function recordInventoryMovement(params: {
  productId: string;
  type: StockMovementType;
  quantity: number;
  operatedBy?: string;
  notes?: string;
}) {
  let operatedBy = params.operatedBy;
  if (!operatedBy) {
    const session = await getSession();
    if (!session) throw new Error("ログインが必要です");
    operatedBy = session.userId;
  }

  const inventory = await repositories.inventory.findByProductId(
    params.productId
  );

  if (!inventory) {
    const [created] = await db
      .insert(inventories)
      .values({
        productId: params.productId,
        currentStock: 0,
        minimumStock: 0,
      })
      .returning();

    await repositories.inventory.recordMovement({
      productId: params.productId,
      inventoryId: created.id,
      type: params.type,
      quantity: params.quantity,
      operatedBy,
      notes: params.notes,
    });
  } else {
    await repositories.inventory.recordMovement({
      productId: params.productId,
      inventoryId: inventory.id,
      type: params.type,
      quantity: params.quantity,
      operatedBy,
      notes: params.notes,
    });
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${params.productId}`);
}

export async function updateMinimumStock(
  productId: string,
  minimumStock: number
) {
  await db
    .update(inventories)
    .set({ minimumStock })
    .where(eq(inventories.productId, productId));

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
}

export async function createQrCode(productId: string, label?: string) {
  const code = `HIK-${productId.slice(0, 8)}-${Date.now().toString(36)}`;

  const [created] = await db
    .insert(qrCodes)
    .values({
      productId,
      code,
      label: label || null,
    })
    .returning();

  revalidatePath("/inventory");
  return created;
}

export async function getQrCodes(productId: string) {
  return db
    .select()
    .from(qrCodes)
    .where(eq(qrCodes.productId, productId))
    .orderBy(desc(qrCodes.createdAt));
}

export async function deactivateQrCode(id: string) {
  await db.update(qrCodes).set({ isActive: false }).where(eq(qrCodes.id, id));
  revalidatePath("/inventory");
}

export async function createProductAndInventory(params: {
  name: string;
  productCode?: string;
  modelNumber?: string;
  manufacturer?: string;
  unitPrice?: string;
  unit?: string;
  category?: string;
  minimumStock?: number;
  initialQuantity?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("ログインが必要です");

  const [product] = await db
    .insert(products)
    .values({
      name: params.name,
      productCode: params.productCode || null,
      modelNumber: params.modelNumber || null,
      manufacturer: params.manufacturer || null,
      unitPrice: params.unitPrice || "0",
      unit: params.unit || "個",
      category: params.category || null,
    })
    .returning();

  const [inventory] = await db
    .insert(inventories)
    .values({
      productId: product.id,
      currentStock: params.initialQuantity ?? 0,
      minimumStock: params.minimumStock ?? 0,
    })
    .returning();

  if (params.initialQuantity && params.initialQuantity > 0) {
    await db.insert(inventoryHistories).values({
      productId: product.id,
      inventoryId: inventory.id,
      type: "in",
      quantity: params.initialQuantity,
      stockAfter: params.initialQuantity,
      operatedBy: session.userId,
      notes: "初期在庫",
    });
  }

  revalidatePath("/inventory");
  return product;
}

export async function updateProductAndInventory(params: {
  productId: string;
  name: string;
  productCode?: string;
  modelNumber?: string;
  manufacturer?: string;
  unitPrice?: string;
  unit?: string;
  category?: string;
  minimumStock?: number;
  currentStock?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("ログインが必要です");

  await db
    .update(products)
    .set({
      name: params.name,
      productCode: params.productCode || null,
      modelNumber: params.modelNumber || null,
      manufacturer: params.manufacturer || null,
      unitPrice: params.unitPrice || "0",
      unit: params.unit || "個",
      category: params.category || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, params.productId));

  const [existing] = await db
    .select()
    .from(inventories)
    .where(eq(inventories.productId, params.productId));

  if (existing) {
    const updates: { minimumStock?: number } = {};
    if (params.minimumStock !== undefined) {
      updates.minimumStock = params.minimumStock;
    }
    if (Object.keys(updates).length > 0) {
      await db
        .update(inventories)
        .set(updates)
        .where(eq(inventories.productId, params.productId));
    }

    // 現在庫が変更された場合、棚卸履歴として記録
    if (
      params.currentStock !== undefined &&
      params.currentStock !== existing.currentStock
    ) {
      await repositories.inventory.recordMovement({
        productId: params.productId,
        inventoryId: existing.id,
        type: "adjust",
        quantity: params.currentStock,
        operatedBy: session.userId,
        notes: "在庫数の直接修正",
      });
    }
  } else {
    await db.insert(inventories).values({
      productId: params.productId,
      currentStock: params.currentStock ?? 0,
      minimumStock: params.minimumStock ?? 0,
    });

    if (params.currentStock && params.currentStock > 0) {
      const [created] = await db
        .select()
        .from(inventories)
        .where(eq(inventories.productId, params.productId));

      await db.insert(inventoryHistories).values({
        productId: params.productId,
        inventoryId: created.id,
        type: "adjust",
        quantity: params.currentStock,
        stockAfter: params.currentStock,
        operatedBy: session.userId,
        notes: "在庫数の直接修正",
      });
    }
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${params.productId}`);
}
