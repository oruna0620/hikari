export interface Product {
  id: string;
  productCode: string | null;
  name: string;
  modelNumber: string | null;
  manufacturer: string | null;
  unitPrice: string;
  unit: string;
  category: string | null;
  description: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSearchKeyword {
  id: string;
  productId: string;
  keyword: string;
  createdAt: Date;
}
