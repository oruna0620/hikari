export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
