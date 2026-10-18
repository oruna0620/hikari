import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { inventories, inventoryHistories } from "../../db/schema";
import type { Inventory } from "@/domain/inventory/entities/inventory";
import type { InventoryHistory } from "@/domain/inventory/entities/inventory-history";
import type { IInventoryRepository } from "@/domain/inventory/repositories/inventory-repository";
import type { StockMovementType } from "@/domain/inventory/value-objects/stock-movement-type";

export class DrizzleInventoryRepository implements IInventoryRepository {
  constructor(private db: Database) {}

  async findByProductId(productId: string): Promise<Inventory | null> {
    const rows = await this.db
      .select()
      .from(inventories)
      .where(eq(inventories.productId, productId));
    return (rows[0] as Inventory) ?? null;
  }

  async findAll(): Promise<Inventory[]> {
    const rows = await this.db.select().from(inventories);
    return rows as Inventory[];
  }

  async recordMovement(params: {
    productId: string;
    inventoryId: string;
    type: StockMovementType;
    quantity: number;
    operatedBy: string;
    notes?: string;
  }): Promise<InventoryHistory> {
    return await this.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(inventories)
        .where(eq(inventories.id, params.inventoryId));

      if (!inv) {
        throw new Error("在庫レコードが見つかりません");
      }

      let newStock: number;
      if (params.type === "in") {
        newStock = inv.currentStock + params.quantity;
      } else if (params.type === "out") {
        newStock = inv.currentStock - params.quantity;
        if (newStock < 0) {
          throw new Error("在庫数が不足しています");
        }
      } else {
        // adjust
        newStock = params.quantity;
      }

      await tx
        .update(inventories)
        .set({
          currentStock: newStock,
          lastUpdatedAt: new Date(),
          lastUpdatedBy: params.operatedBy,
        })
        .where(eq(inventories.id, params.inventoryId));

      const [history] = await tx
        .insert(inventoryHistories)
        .values({
          productId: params.productId,
          inventoryId: params.inventoryId,
          type: params.type,
          quantity: params.quantity,
          stockAfter: newStock,
          operatedBy: params.operatedBy,
          notes: params.notes ?? null,
        })
        .returning();

      return history as InventoryHistory;
    });
  }
}
