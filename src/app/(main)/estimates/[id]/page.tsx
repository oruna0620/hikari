import { db } from "@/infrastructure/db/client";
import {
  estimates,
  estimateItems,
  customers,
  products,
  taxSettings,
  uploadedDocuments,
} from "@/infrastructure/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EstimateForm } from "../estimate-form";

export const metadata = { title: "見積もり編集 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [estimateRows, itemRows, customerList, productList, taxRows, attachmentRows] =
    await Promise.all([
      db.select().from(estimates).where(eq(estimates.id, id)),
      db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, id))
        .orderBy(asc(estimateItems.sortOrder)),
      db
        .select()
        .from(customers)
        .where(eq(customers.isDeleted, false)),
      db
        .select()
        .from(products)
        .where(eq(products.isDeleted, false)),
      db.select().from(taxSettings).limit(1),
      db
        .select()
        .from(uploadedDocuments)
        .where(eq(uploadedDocuments.estimateId, id)),
    ]);

  const estimate = estimateRows[0];
  if (!estimate) notFound();

  const taxRate = taxRows[0]?.taxRate ?? "10.00";

  return (
    <EstimateForm
      estimateId={estimate.id}
      estimateNumber={estimate.estimateNumber}
      customers={customerList}
      products={productList}
      taxRate={taxRate}
      initialAttachments={attachmentRows.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
      }))}
      initial={{
        customerId: estimate.customerId,
        customerName: estimate.customerName,
        title: estimate.title,
        issueDate: estimate.issueDate,
        expiryDate: estimate.expiryDate,
        notes: estimate.notes,
        status: estimate.status,
        items: itemRows.map((it) => ({
          productId: it.productId,
          itemName: it.itemName,
          modelNumber: it.modelNumber,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          amount: it.amount,
        })),
      }}
    />
  );
}
