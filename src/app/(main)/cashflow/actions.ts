"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/infrastructure/db/client";
import {
  invoices,
  invoiceItems,
  payments,
  expenses,
  uploadedDocuments,
} from "@/infrastructure/db/schema";
import { eq, sql, desc, like, inArray } from "drizzle-orm";

// ── Invoice Number Generation ──

export async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `INV-${y}${m}${d}-`;

  const existing = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`))
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  let seq = 1;
  if (existing.length > 0) {
    const last = existing[0].invoiceNumber;
    const lastSeq = parseInt(last.split("-").pop() ?? "0", 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// ── Invoices ──

export async function createInvoice(
  data: {
    invoiceNumber: string;
    customerId: string;
    estimateId?: string | null;
    title?: string | null;
    issueDate: string;
    dueDate?: string | null;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    totalAmount: string;
    notes?: string | null;
  },
  items: {
    sortOrder: number;
    itemName: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    amount: string;
  }[],
  options?: { sourceType?: string; createdBy?: string; attachmentIds?: string[] }
) {
  await db.transaction(async (tx) => {
    const [inv] = await tx
      .insert(invoices)
      .values({
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        estimateId: data.estimateId ?? null,
        title: data.title ?? null,
        issueDate: data.issueDate,
        dueDate: data.dueDate ?? null,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes ?? null,
        sourceType: options?.sourceType ?? "manual",
        createdBy: options?.createdBy ?? null,
      })
      .returning();

    if (items.length > 0) {
      await tx.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId: inv.id,
          ...item,
        }))
      );
    }

    // Link uploaded attachments to this invoice
    const attachmentIds = options?.attachmentIds ?? [];
    if (attachmentIds.length > 0) {
      await tx
        .update(uploadedDocuments)
        .set({ invoiceId: inv.id })
        .where(inArray(uploadedDocuments.id, attachmentIds));
    }
  });
  revalidatePath("/cashflow");
}

export async function updateInvoice(
  id: string,
  data: {
    customerId: string;
    title?: string | null;
    issueDate: string;
    dueDate?: string | null;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    totalAmount: string;
    notes?: string | null;
    paymentStatus?: string;
  },
  items: {
    sortOrder: number;
    itemName: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    amount: string;
  }[]
) {
  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        customerId: data.customerId,
        title: data.title ?? null,
        issueDate: data.issueDate,
        dueDate: data.dueDate ?? null,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes ?? null,
        paymentStatus: data.paymentStatus,
      })
      .where(eq(invoices.id, id));

    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

    if (items.length > 0) {
      await tx.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId: id,
          ...item,
        }))
      );
    }
  });
  revalidatePath("/cashflow");
}

export async function deleteInvoice(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(payments).where(eq(payments.invoiceId, id));
    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await tx.delete(invoices).where(eq(invoices.id, id));
  });
  revalidatePath("/cashflow");
}

// ── Payments ──

export async function createPayment(data: {
  invoiceId: string;
  customerId: string;
  expectedDate?: string | null;
  expectedAmount?: string | null;
  actualDate?: string | null;
  actualAmount?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}) {
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      expectedDate: data.expectedDate ?? null,
      expectedAmount: data.expectedAmount ?? null,
      actualDate: data.actualDate ?? null,
      actualAmount: data.actualAmount ?? null,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes ?? null,
    });

    // Update invoice paid_amount and status
    const paymentRows = await tx
      .select({ total: sql<string>`COALESCE(SUM(actual_amount), 0)` })
      .from(payments)
      .where(eq(payments.invoiceId, data.invoiceId));

    const paidAmount = paymentRows[0]?.total ?? "0";

    const [inv] = await tx
      .select({ totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(eq(invoices.id, data.invoiceId));

    let status = "unpaid";
    if (Number(paidAmount) >= Number(inv.totalAmount)) {
      status = "paid";
    } else if (Number(paidAmount) > 0) {
      status = "partial";
    }

    await tx
      .update(invoices)
      .set({ paidAmount, paymentStatus: status })
      .where(eq(invoices.id, data.invoiceId));
  });
  revalidatePath("/cashflow");
}

export async function deletePayment(id: string, invoiceId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(payments).where(eq(payments.id, id));

    const paymentRows = await tx
      .select({ total: sql<string>`COALESCE(SUM(actual_amount), 0)` })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    const paidAmount = paymentRows[0]?.total ?? "0";

    const [inv] = await tx
      .select({ totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    let status = "unpaid";
    if (Number(paidAmount) >= Number(inv.totalAmount)) {
      status = "paid";
    } else if (Number(paidAmount) > 0) {
      status = "partial";
    }

    await tx
      .update(invoices)
      .set({ paidAmount, paymentStatus: status })
      .where(eq(invoices.id, invoiceId));
  });
  revalidatePath("/cashflow");
}

// ── Expenses ──

export async function createExpense(data: {
  payeeName: string;
  customerId?: string | null;
  category?: string | null;
  title?: string | null;
  expectedDate?: string | null;
  expectedAmount?: string | null;
  actualDate?: string | null;
  actualAmount?: string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  notes?: string | null;
}) {
  await db.insert(expenses).values({
    payeeName: data.payeeName,
    customerId: data.customerId ?? null,
    category: data.category ?? null,
    title: data.title ?? null,
    expectedDate: data.expectedDate ?? null,
    expectedAmount: data.expectedAmount ?? null,
    actualDate: data.actualDate ?? null,
    actualAmount: data.actualAmount ?? null,
    paymentStatus: data.paymentStatus,
    paymentMethod: data.paymentMethod ?? null,
    notes: data.notes ?? null,
  });
  revalidatePath("/cashflow");
}

export async function updateExpense(
  id: string,
  data: {
    payeeName: string;
    customerId?: string | null;
    category?: string | null;
    title?: string | null;
    expectedDate?: string | null;
    expectedAmount?: string | null;
    actualDate?: string | null;
    actualAmount?: string | null;
    paymentStatus: string;
    paymentMethod?: string | null;
    notes?: string | null;
  }
) {
  await db
    .update(expenses)
    .set({
      payeeName: data.payeeName,
      customerId: data.customerId ?? null,
      category: data.category ?? null,
      title: data.title ?? null,
      expectedDate: data.expectedDate ?? null,
      expectedAmount: data.expectedAmount ?? null,
      actualDate: data.actualDate ?? null,
      actualAmount: data.actualAmount ?? null,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes ?? null,
    })
    .where(eq(expenses.id, id));
  revalidatePath("/cashflow");
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/cashflow");
}

// ── Uploaded Documents ──

export async function linkDocumentToInvoice(
  documentId: string,
  invoiceId: string | null
) {
  await db
    .update(uploadedDocuments)
    .set({ invoiceId: invoiceId || null })
    .where(eq(uploadedDocuments.id, documentId));
  revalidatePath("/cashflow");
}

// ── Create from AI Extraction ──

export async function createInvoiceFromExtraction(data: {
  documentId: string;
  customerId: string;
  title: string | null;
  issueDate: string;
  dueDate: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
  items: {
    sortOrder: number;
    itemName: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    amount: string;
  }[];
}) {
  const invoiceNumber = await generateInvoiceNumber();

  await db.transaction(async (tx) => {
    const [inv] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId: data.customerId,
        title: data.title,
        issueDate: data.issueDate,
        dueDate: data.dueDate ?? null,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes,
        sourceType: "ai_extraction",
      })
      .returning();

    if (data.items.length > 0) {
      await tx.insert(invoiceItems).values(
        data.items.map((item) => ({
          invoiceId: inv.id,
          ...item,
        }))
      );
    }

    // Link document to the new invoice
    await tx
      .update(uploadedDocuments)
      .set({ invoiceId: inv.id, documentType: "sales", status: "saved" })
      .where(eq(uploadedDocuments.id, data.documentId));
  });

  revalidatePath("/cashflow");
}

export async function createExpenseFromExtraction(data: {
  documentId: string;
  payeeName: string;
  category: string | null;
  title: string | null;
  expectedDate: string | null;
  expectedAmount: string | null;
  notes: string | null;
}) {
  await db.transaction(async (tx) => {
    const [exp] = await tx
      .insert(expenses)
      .values({
        payeeName: data.payeeName,
        category: data.category ?? "仕入",
        title: data.title,
        expectedDate: data.expectedDate ?? null,
        expectedAmount: data.expectedAmount ?? null,
        paymentStatus: "unpaid",
        notes: data.notes,
      })
      .returning();

    // Link document to the new expense
    await tx
      .update(uploadedDocuments)
      .set({ expenseId: exp.id, documentType: "purchase", status: "saved" })
      .where(eq(uploadedDocuments.id, data.documentId));
  });

  revalidatePath("/cashflow");
}

export async function deleteDocument(id: string) {
  const rows = await db
    .select()
    .from(uploadedDocuments)
    .where(eq(uploadedDocuments.id, id));
  const doc = rows[0];
  if (doc) {
    // Delete physical file
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    try {
      await unlink(join(process.cwd(), "public", doc.fileUrl));
    } catch {
      // File may already be deleted
    }
    await db.delete(uploadedDocuments).where(eq(uploadedDocuments.id, id));
  }
  revalidatePath("/cashflow");
}
