export interface Inventory {
  id: string;
  productId: string;
  currentStock: number;
  minimumStock: number;
  lastUpdatedAt: Date;
  lastUpdatedBy: string | null;
  createdAt: Date;
}
