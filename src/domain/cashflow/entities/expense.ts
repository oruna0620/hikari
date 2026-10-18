import type { ExpensePaymentStatus } from "../value-objects/payment-status";

export interface Expense {
  id: string;
  payeeName: string;
  customerId: string | null;
  category: string | null;
  title: string | null;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod: string | null;
  fileUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
