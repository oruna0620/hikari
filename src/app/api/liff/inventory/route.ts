import { NextResponse } from "next/server";
import { resolveUserFromLiffToken } from "@/lib/line/liff-auth";
import { repositories } from "@/lib/di/container";
import type { StockMovementType } from "@/domain/inventory/value-objects/stock-movement-type";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "") || null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "在庫操作にはLINEログインが必要です" },
        { status: 401 }
      );
    }

    const user = await resolveUserFromLiffToken(accessToken);
    const body = await request.json();

    const { productId, type, quantity, notes } = body as {
      productId: string;
      type: StockMovementType;
      quantity: number;
      notes?: string;
    };

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: "productId, type, quantity は必須です" },
        { status: 400 }
      );
    }

    if (!["in", "out", "adjust"].includes(type)) {
      return NextResponse.json(
        { error: "type は in, out, adjust のいずれかです" },
        { status: 400 }
      );
    }

    const inventory = await repositories.inventory.findByProductId(productId);
    if (!inventory) {
      return NextResponse.json(
        { error: "在庫レコードが見つかりません" },
        { status: 404 }
      );
    }

    const history = await repositories.inventory.recordMovement({
      productId,
      inventoryId: inventory.id,
      type,
      quantity,
      operatedBy: user.userId,
      notes,
    });

    return NextResponse.json({
      success: true,
      stockAfter: history.stockAfter,
      historyId: history.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record movement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
