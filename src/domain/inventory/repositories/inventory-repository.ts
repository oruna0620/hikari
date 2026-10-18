import type { Inventory } from "../entities/inventory";
import type { InventoryHistory } from "../entities/inventory-history";
import type { StockMovementType } from "../value-objects/stock-movement-type";

export interface IInventoryRepository {
  findByProductId(productId: string): Promise<Inventory | null>;
  findAll(): Promise<Inventory[]>;
  recordMovement(params: {
    productId: string;
    inventoryId: string;
    type: StockMovementType;
    quantity: number;
    operatedBy: string;
    notes?: string;
  }): Promise<InventoryHistory>;
}
