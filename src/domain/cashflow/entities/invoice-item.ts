export interface InvoiceItem {
  id: string;
  invoiceId: string;
  sortOrder: number;
  itemName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  createdAt: Date;
}
