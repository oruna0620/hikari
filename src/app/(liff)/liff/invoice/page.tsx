import { db } from "@/infrastructure/db/client";
import { customers, taxSettings } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { LiffInvoiceForm } from "./liff-invoice-form";

export const metadata = { title: "請求書作成 | 株式会社光" };
export const dynamic = "force-dynamic";

export default async function LiffInvoicePage() {
  const [customerList, taxList] = await Promise.all([
    db
      .select({
        id: customers.id,
        customerName: customers.customerName,
        companyName: customers.companyName,
      })
      .from(customers)
      .where(eq(customers.isDeleted, false)),
    db.select().from(taxSettings).limit(1),
  ]);

  const taxRate = taxList[0]?.taxRate ?? "10.00";

  return <LiffInvoiceForm customers={customerList} taxRate={taxRate} />;
}
