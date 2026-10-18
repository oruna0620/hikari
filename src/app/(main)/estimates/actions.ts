"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/infrastructure/db/client";
import { estimates, estimateItems, uploadedDocuments } from "@/infrastructure/db/schema";
import { eq, desc, like, inArray } from "drizzle-orm";

/* ── Types ── */
export type EstimateData = {
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
  status: string;
};

export type EstimateItemData = {
  sortOrder: number;
  productId: string | null;
  itemName: string;
  modelNumber: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
};

/* ── Generate next estimate number ── */
export async function generateEstimateNumber(): Promise<string> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `EST-${y}${m}${d}-`;

  const existing = await db
    .select({ estimateNumber: estimates.estimateNumber })
    .from(estimates)
    .where(like(estimates.estimateNumber, `${prefix}%`))
    .orderBy(desc(estimates.estimateNumber))
    .limit(1);

  let seq = 1;
  if (existing.length > 0) {
    const last = existing[0].estimateNumber;
    const lastSeq = parseInt(last.split("-").pop() ?? "0", 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

/* ── Create ── */
export async function createEstimate(
  data: EstimateData,
  items: EstimateItemData[],
  options?: { sourceType?: string; createdBy?: string; attachmentIds?: string[] }
) {
  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(estimates)
      .values({
        estimateNumber: data.estimateNumber,
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        title: data.title || null,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || null,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes || null,
        status: data.status,
        sourceType: options?.sourceType ?? "manual",
        createdBy: options?.createdBy ?? null,
      })
      .returning({ id: estimates.id });

    if (items.length > 0) {
      await tx.insert(estimateItems).values(
        items.map((item) => ({
          estimateId: inserted.id,
          sortOrder: item.sortOrder,
          productId: item.productId || null,
          itemName: item.itemName,
          modelNumber: item.modelNumber || null,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          amount: item.amount,
        }))
      );
    }

    // Link uploaded attachments to this estimate
    const attachmentIds = options?.attachmentIds ?? [];
    if (attachmentIds.length > 0) {
      await tx
        .update(uploadedDocuments)
        .set({ estimateId: inserted.id })
        .where(inArray(uploadedDocuments.id, attachmentIds));
    }
  });

  revalidatePath("/estimates");
}

/* ── Update ── */
export async function updateEstimate(
  id: string,
  data: EstimateData,
  items: EstimateItemData[]
) {
  await db.transaction(async (tx) => {
    await tx
      .update(estimates)
      .set({
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        title: data.title || null,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || null,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes || null,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(estimates.id, id));

    await tx.delete(estimateItems).where(eq(estimateItems.estimateId, id));

    if (items.length > 0) {
      await tx.insert(estimateItems).values(
        items.map((item) => ({
          estimateId: id,
          sortOrder: item.sortOrder,
          productId: item.productId || null,
          itemName: item.itemName,
          modelNumber: item.modelNumber || null,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          amount: item.amount,
        }))
      );
    }
  });

  revalidatePath("/estimates");
}

/* ── Delete ── */
export async function deleteEstimate(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(estimateItems).where(eq(estimateItems.estimateId, id));
    await tx.delete(estimates).where(eq(estimates.id, id));
  });

  revalidatePath("/estimates");
}
