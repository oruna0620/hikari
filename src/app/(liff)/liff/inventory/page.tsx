import { db } from "@/infrastructure/db/client";
import { products, inventories, qrCodes } from "@/infrastructure/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { LiffInventoryForm } from "./liff-inventory-form";

export const metadata = { title: "在庫操作 | BUTIKOMI" };

async function lookupByCode(code: string) {
  // 1. QRコードテーブルから検索（完全一致 → 前方一致）
  let [qr] = await db
    .select()
    .from(qrCodes)
    .where(and(eq(qrCodes.code, code), eq(qrCodes.isActive, true)));

  if (!qr) {
    [qr] = await db
      .select()
      .from(qrCodes)
      .where(and(like(qrCodes.code, `${code}%`), eq(qrCodes.isActive, true)))
      .limit(1);
  }

  let productId: string | null = null;

  if (qr) {
    productId = qr.productId;
  } else {
    // 2. フォールバック: HIK-{id先頭8文字} からproductを検索
    const prefix = code.replace(/^HIK-/, "");
    if (prefix) {
      const [found] = await db
        .select()
        .from(products)
        .where(sql`${products.id}::text LIKE ${prefix + "%"}`)
        .limit(1);
      if (found) productId = found.id;
    }
  }

  if (!productId) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));
  if (!product) return null;

  const [inventory] = await db
    .select()
    .from(inventories)
    .where(eq(inventories.productId, productId));

  return {
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
  };
}

export default async function LiffInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; success?: string }>;
}) {
  const { code, error, success } = await searchParams;

  if (!code) {
    return (
      <div
        style={{
          padding: "2rem 1rem",
          textAlign: "center",
          color: "#888",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
          在庫操作
        </h1>
        <p>QRコードをスキャンして在庫操作を行ってください</p>
      </div>
    );
  }

  const data = await lookupByCode(code);

  if (!data) {
    return (
      <div
        style={{
          padding: "2rem 1rem",
          textAlign: "center",
          color: "#c00",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
          在庫操作
        </h1>
        <p>商品が見つかりません（code: {code}）</p>
      </div>
    );
  }

  return (
    <LiffInventoryForm
      product={data.product}
      inventory={data.inventory}
      code={code}
      error={error}
      success={success}
    />
  );
}
