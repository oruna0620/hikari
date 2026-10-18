import type { PaymentStatus } from "../value-objects/payment-status";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  estimateId: string | null;
  title: string | null;
  issueDate: string;
  dueDate: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  fileUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
