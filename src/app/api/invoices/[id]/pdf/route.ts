import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/infrastructure/db/client";
import {
  invoices,
  invoiceItems,
  customers,
  companySettings,
} from "@/infrastructure/db/schema";
import { eq, asc } from "drizzle-orm";
import { InvoicePDF } from "@/lib/pdf/invoice-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [invoiceRows, itemRows, companyRows] = await Promise.all([
    db.select().from(invoices).where(eq(invoices.id, id)),
    db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .orderBy(asc(invoiceItems.sortOrder)),
    db.select().from(companySettings).limit(1),
  ]);

  const invoice = invoiceRows[0];
  if (!invoice) {
    return NextResponse.json(
      { error: "請求書が見つかりません" },
      { status: 404 }
    );
  }

  // Get customer name
  const customerRows = await db
    .select({ customerName: customers.customerName, companyName: customers.companyName })
    .from(customers)
    .where(eq(customers.id, invoice.customerId));

  const customer = customerRows[0];
  const customerName = customer
    ? customer.companyName
      ? `${customer.companyName} / ${customer.customerName}`
      : customer.customerName
    : "—";

  const buffer = await renderToBuffer(
    InvoicePDF({
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        notes: invoice.notes,
      },
      customerName,
      items: itemRows.map((it) => ({
        itemName: it.itemName,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        amount: it.amount,
      })),
      company: companyRows[0] ?? null,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
