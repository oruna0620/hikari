import type { Payment } from "../entities/payment";

export interface IPaymentRepository {
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  create(
    data: Omit<Payment, "id" | "createdAt" | "updatedAt">
  ): Promise<Payment>;
}
