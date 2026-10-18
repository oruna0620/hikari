export interface EstimateItem {
  id: string;
  estimateId: string;
  sortOrder: number;
  productId: string | null;
  itemName: string;
  modelNumber: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  createdAt: Date;
}
