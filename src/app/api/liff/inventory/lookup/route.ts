import { NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { qrCodes, products, inventories } from "@/infrastructure/db/schema";
import { eq, and, like, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "code parameter is required" },
        { status: 400 }
      );
    }

    // Try exact match first, then prefix match (QR URL uses HIK-{id8}, DB stores HIK-{id8}-{timestamp})
    let [qr] = await db
      .select()
      .from(qrCodes)
      .where(and(eq(qrCodes.code, code), eq(qrCodes.isActive, true)));

    if (!qr) {
      [qr] = await db
        .select()
        .from(qrCodes)
        .where(
          and(like(qrCodes.code, `${code}%`), eq(qrCodes.isActive, true))
        )
        .limit(1);
    }

    let productId: string;

    if (qr) {
      productId = qr.productId;
    } else {
      // Fallback: extract productId prefix from code (HIK-{id8chars}) and search by prefix
      const prefix = code.replace(/^HIK-/, "");
      if (!prefix) {
        return NextResponse.json(
          { error: "QRコードが見つかりません" },
          { status: 404 }
        );
      }
      const [found] = await db
        .select()
        .from(products)
        .where(sql`${products.id}::text LIKE ${prefix + "%"}`)
        .limit(1);
      if (!found) {
        return NextResponse.json(
          { error: "QRコードが見つかりません" },
          { status: 404 }
        );
      }
      productId = found.id;
    }

    // Get product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    // Get inventory
    const [inventory] = await db
      .select()
      .from(inventories)
      .where(eq(inventories.productId, productId));

    return NextResponse.json({
      product: {
        id: product.id,
        productCode: product.productCode,
        name: product.name,
        modelNumber: product.modelNumber,
        unit: product.unit,
      },
      inventory: inventory
        ? {
            id: inventory.id,
            currentStock: inventory.currentStock,
            minimumStock: inventory.minimumStock,
          }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
