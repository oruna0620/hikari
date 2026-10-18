export interface Customer {
  id: string;
  companyName: string | null;
  customerName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  postalCode: string | null;
  address: string | null;
  billingPostalCode: string | null;
  billingAddress: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
