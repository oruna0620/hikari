export interface CompanySettings {
  id: string;
  companyName: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  registrationNumber: string | null;
  logoUrl: string | null;
  bankInfo: string | null;
  estimateNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
