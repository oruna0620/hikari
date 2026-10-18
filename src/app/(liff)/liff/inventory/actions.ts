"use server";

import { redirect } from "next/navigation";
import { repositories } from "@/lib/di/container";
import type { StockMovementType } from "@/domain/inventory/value-objects/stock-movement-type";
import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";

export async function submitMovement(formData: FormData) {
  const productId = formData.get("productId") as string;
  const code = formData.get("code") as string;
  const type = formData.get("type") as StockMovementType;
  const quantity = Number(formData.get("quantity"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!productId || !type || !quantity || quantity <= 0) {
    redirect(
      `/liff/inventory?code=${encodeURIComponent(code)}&error=${encodeURIComponent("入力内容を確認してください")}`
    );
  }

  if (!["in", "out", "adjust"].includes(type)) {
    redirect(
      `/liff/inventory?code=${encodeURIComponent(code)}&error=${encodeURIComponent("操作種別が不正です")}`
    );
  }

  const inventory = await repositories.inventory.findByProductId(productId);
  if (!inventory) {
    redirect(
      `/liff/inventory?code=${encodeURIComponent(code)}&error=${encodeURIComponent("在庫レコードが見つかりません")}`
    );
  }

  // ゲストユーザーを取得（最初のユーザーをフォールバックとして使用）
  const [firstUser] = await db.select().from(users).limit(1);
  const operatedBy = firstUser?.id ?? productId;

  let redirectUrl: string;

  try {
    const history = await repositories.inventory.recordMovement({
      productId,
      inventoryId: inventory.id,
      type,
      quantity,
      operatedBy,
      notes,
    });

    const typeLabel = type === "in" ? "入庫" : type === "out" ? "出庫" : "棚卸";
    redirectUrl = `/liff/inventory?code=${encodeURIComponent(code)}&success=${encodeURIComponent(
      `${typeLabel}を登録しました。更新後在庫: ${history.stockAfter}`
    )}`;
  } catch {
    redirectUrl = `/liff/inventory?code=${encodeURIComponent(code)}&error=${encodeURIComponent("操作に失敗しました")}`;
  }

  redirect(redirectUrl);
}
