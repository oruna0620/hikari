import { db } from "@/infrastructure/db/client";
import {
  invoices,
  invoiceItems,
  payments,
  customers,
  taxSettings,
  uploadedDocuments,
} from "@/infrastructure/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvoiceForm } from "../../invoice-form";

export const metadata = { title: "請求書編集 | 株式会社光" };
export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [invoiceRows, itemRows, paymentRows, customerList, taxRows, attachmentRows] =
    await Promise.all([
      db.select().from(invoices).where(eq(invoices.id, id)),
      db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id))
        .orderBy(asc(invoiceItems.sortOrder)),
      db.select().from(payments).where(eq(payments.invoiceId, id)),
      db
        .select()
        .from(customers)
        .where(eq(customers.isDeleted, false)),
      db.select().from(taxSettings).limit(1),
      db
        .select()
        .from(uploadedDocuments)
        .where(eq(uploadedDocuments.invoiceId, id)),
    ]);

  const invoice = invoiceRows[0];
  if (!invoice) notFound();

  const taxRate = taxRows[0]?.taxRate ?? "10.00";

  return (
    <InvoiceForm
      invoiceId={invoice.id}
      invoiceNumber={invoice.invoiceNumber}
      customers={customerList}
      taxRate={taxRate}
      initialAttachments={attachmentRows.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
      }))}
      initial={{
        customerId: invoice.customerId,
        title: invoice.title,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        paymentStatus: invoice.paymentStatus,
        items: itemRows.map((it) => ({
          itemName: it.itemName,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          amount: it.amount,
        })),
        payments: paymentRows,
      }}
    />
  );
}
