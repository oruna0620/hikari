import type { EstimateStatus, SourceType } from "../value-objects/estimate-status";

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string | null;
  customerName: string | null;
  title: string | null;
  issueDate: string;
  expiryDate: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
  status: EstimateStatus;
  sourceType: SourceType;
  uploadedDocumentId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
