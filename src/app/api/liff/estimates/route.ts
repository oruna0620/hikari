import { NextResponse } from "next/server";
import { resolveUserFromLiffToken } from "@/lib/line/liff-auth";
import { sendPdfLink } from "@/lib/line/send-pdf";
import { db } from "@/infrastructure/db/client";
import {
  estimates,
  estimateItems,
  customers,
} from "@/infrastructure/db/schema";
import { desc, like, eq } from "drizzle-orm";

async function generateEstimateNumber(): Promise<string> {
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    const user = await resolveUserFromLiffToken(accessToken);
    const body = await request.json();

    const {
      customerId,
      title,
      issueDate,
      expiryDate,
      notes,
      items: itemsData,
      taxRate = "10.00",
    } = body;

    if (!customerId || !itemsData || itemsData.length === 0) {
      return NextResponse.json(
        { error: "顧客と明細は必須です" },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = itemsData.map(
      (
        item: {
          productId?: string;
          itemName: string;
          modelNumber?: string;
          quantity: number;
          unit: string;
          unitPrice: number;
        },
        idx: number
      ) => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return {
          sortOrder: idx + 1,
          productId: item.productId || null,
          itemName: item.itemName,
          modelNumber: item.modelNumber || null,
          quantity: String(item.quantity),
          unit: item.unit,
          unitPrice: String(item.unitPrice),
          amount: String(amount),
        };
      }
    );

    const taxAmount = Math.floor(subtotal * (Number(taxRate) / 100));
    const totalAmount = subtotal + taxAmount;

    const estimateNumber = await generateEstimateNumber();

    // Get customer name
    const [customer] = await db
      .select({ customerName: customers.customerName })
      .from(customers)
      .where(eq(customers.id, customerId));

    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(estimates)
        .values({
          estimateNumber,
          customerId,
          customerName: customer?.customerName ?? null,
          title: title || null,
          issueDate: issueDate || new Date().toISOString().split("T")[0],
          expiryDate: expiryDate || null,
          subtotal: String(subtotal),
          taxRate,
          taxAmount: String(taxAmount),
          totalAmount: String(totalAmount),
          notes: notes || null,
          status: "draft",
          sourceType: "line",
          createdBy: user.userId,
        })
        .returning();

      if (processedItems.length > 0) {
        await tx.insert(estimateItems).values(
          processedItems.map(
            (item: {
              sortOrder: number;
              productId: string | null;
              itemName: string;
              modelNumber: string | null;
              quantity: string;
              unit: string;
              unitPrice: string;
              amount: string;
            }) => ({
              estimateId: inserted.id,
              ...item,
            })
          )
        );
      }

      return inserted;
    });

    // Send PDF link via LINE
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hikari.example.com";
    try {
      await sendPdfLink({
        lineUserId: user.lineUserId,
        title: "見積書",
        documentNumber: estimateNumber,
        downloadUrl: `${appUrl}/api/estimates/${result.id}/pdf`,
      });
    } catch {
      // PDF sending failure should not fail the API
    }

    return NextResponse.json({
      id: result.id,
      estimateNumber,
      totalAmount: String(totalAmount),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create estimate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
