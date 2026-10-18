export interface QrCode {
  id: string;
  productId: string;
  code: string;
  label: string | null;
  isActive: boolean;
  createdAt: Date;
}
