import { db } from "@/infrastructure/db/client";
import { customers, taxSettings } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoiceNumber } from "../../actions";
import { InvoiceForm } from "../../invoice-form";

export const metadata = { title: "請求書作成 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [invoiceNumber, customerList, taxRows] = await Promise.all([
    generateInvoiceNumber(),
    db
      .select()
      .from(customers)
      .where(eq(customers.isDeleted, false)),
    db.select().from(taxSettings).limit(1),
  ]);

  const taxRate = taxRows[0]?.taxRate ?? "10.00";

  return (
    <InvoiceForm
      invoiceNumber={invoiceNumber}
      customers={customerList}
      taxRate={taxRate}
    />
  );
}
