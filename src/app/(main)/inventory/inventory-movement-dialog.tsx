"use client";

import { useState } from "react";
import s from "../../_components/shared.module.css";
import { recordInventoryMovement } from "./actions";
import type { InventoryWithProduct } from "./actions";
import type { StockMovementType } from "@/domain/inventory/value-objects/stock-movement-type";

type Props = {
  inventory: InventoryWithProduct;
  onClose: () => void;
};

export function InventoryMovementDialog({ inventory, onClose }: Props) {
  const [type, setType] = useState<StockMovementType>("in");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("数量を正しく入力してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await recordInventoryMovement({
        productId: inventory.productId,
        type,
        quantity: qty,
        operatedBy: "", // will be resolved from session in server action
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "操作に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.modalTitle}>在庫操作</h2>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 600 }}>{inventory.productName}</div>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
            }}
          >
            現在庫: {inventory.currentStock} {inventory.unit}
          </div>
        </div>

        {error && <div className={s.formError}>{error}</div>}

        <div className={s.formGroup}>
          <label className={s.formLabel}>操作種別</label>
          <select
            className={s.formSelect}
            value={type}
            onChange={(e) => setType(e.target.value as StockMovementType)}
          >
            <option value="in">入庫</option>
            <option value="out">出庫</option>
            <option value="adjust">棚卸</option>
          </select>
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>
            {type === "adjust" ? "棚卸数量" : "数量"}
          </label>
          <input
            type="number"
            className={s.formInput}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={type === "adjust" ? "0" : "1"}
          />
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>メモ</label>
          <textarea
            className={s.formTextarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="補足事項（任意）"
          />
        </div>

        <div className={s.formActions}>
          <button
            className={s.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "登録中..." : "登録"}
          </button>
          <button className={s.btnSecondary} onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
