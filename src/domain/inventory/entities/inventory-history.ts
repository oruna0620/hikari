import type { StockMovementType } from "../value-objects/stock-movement-type";

export interface InventoryHistory {
  id: string;
  productId: string;
  inventoryId: string;
  type: StockMovementType;
  quantity: number;
  stockAfter: number;
  operatedBy: string;
  operatedAt: Date;
  notes: string | null;
  isCancelled: boolean;
  createdAt: Date;
}
