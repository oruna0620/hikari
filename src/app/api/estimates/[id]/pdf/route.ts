import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/infrastructure/db/client";
import {
  estimates,
  estimateItems,
  companySettings,
} from "@/infrastructure/db/schema";
import { eq, asc } from "drizzle-orm";
import { EstimatePDF } from "@/lib/pdf/estimate-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [estimateRows, itemRows, companyRows] = await Promise.all([
    db.select().from(estimates).where(eq(estimates.id, id)),
    db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, id))
      .orderBy(asc(estimateItems.sortOrder)),
    db.select().from(companySettings).limit(1),
  ]);

  const estimate = estimateRows[0];
  if (!estimate) {
    return NextResponse.json(
      { error: "見積もりが見つかりません" },
      { status: 404 }
    );
  }

  const buffer = await renderToBuffer(
    EstimatePDF({
      estimate: {
        estimateNumber: estimate.estimateNumber,
        customerName: estimate.customerName,
        title: estimate.title,
        issueDate: estimate.issueDate,
        expiryDate: estimate.expiryDate,
        subtotal: estimate.subtotal,
        taxRate: estimate.taxRate,
        taxAmount: estimate.taxAmount,
        totalAmount: estimate.totalAmount,
        notes: estimate.notes,
      },
      items: itemRows.map((it) => ({
        itemName: it.itemName,
        modelNumber: it.modelNumber,
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
      "Content-Disposition": `attachment; filename="${estimate.estimateNumber}.pdf"`,
    },
  });
}
