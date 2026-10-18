"use client";

import { useState } from "react";
import Link from "next/link";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import s from "../../_components/shared.module.css";
import type { InventoryWithProduct } from "./actions";
import {
  createProductAndInventory,
  updateProductAndInventory,
} from "./actions";

function StockBadge({
  currentStock,
  minimumStock,
}: {
  currentStock: number;
  minimumStock: number;
}) {
  if (currentStock <= 0) {
    return <span className={s.badgeRejected}>在庫切れ</span>;
  }
  if (currentStock <= minimumStock) {
    return <span className={s.badgeUnpaid}>在庫少</span>;
  }
  return <span className={s.badgeAccepted}>在庫あり</span>;
}

function CreateInventoryDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [unit, setUnit] = useState("個");
  const [category, setCategory] = useState("");
  const [minimumStock, setMinimumStock] = useState("0");
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("品名は必須です");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createProductAndInventory({
        name: name.trim(),
        productCode: productCode.trim() || undefined,
        modelNumber: modelNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        unitPrice: unitPrice.trim() || undefined,
        unit: unit.trim() || undefined,
        category: category.trim() || undefined,
        minimumStock: Number(minimumStock) || 0,
        initialQuantity: Number(initialQuantity) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.modalTitle}>在庫の新規追加</h2>

        {error && <div className={s.formError}>{error}</div>}

        <div className={s.formGroup}>
          <label className={s.formLabel}>品名 *</label>
          <input
            type="text"
            className={s.formInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ネジ M4×20"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>品目コード</label>
            <input
              type="text"
              className={s.formInput}
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="例: SCR-001"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>型番</label>
            <input
              type="text"
              className={s.formInput}
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>メーカー</label>
            <input
              type="text"
              className={s.formInput}
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>カテゴリ</label>
            <input
              type="text"
              className={s.formInput}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>単価</label>
            <input
              type="number"
              className={s.formInput}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>単位</label>
            <input
              type="text"
              className={s.formInput}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="個"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>最低在庫</label>
            <input
              type="number"
              className={s.formInput}
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>初期数量</label>
          <input
            type="number"
            className={s.formInput}
            value={initialQuantity}
            onChange={(e) => setInitialQuantity(e.target.value)}
            min="0"
          />
        </div>

        <div className={s.formActions}>
          <button
            className={s.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "作成中..." : "作成"}
          </button>
          <button className={s.btnSecondary} onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

function EditInventoryDialog({
  inventory,
  onClose,
}: {
  inventory: InventoryWithProduct;
  onClose: () => void;
}) {
  const [name, setName] = useState(inventory.productName);
  const [productCode, setProductCode] = useState(inventory.productCode ?? "");
  const [modelNumber, setModelNumber] = useState(inventory.modelNumber ?? "");
  const [manufacturer, setManufacturer] = useState(
    inventory.manufacturer ?? ""
  );
  const [unitPrice, setUnitPrice] = useState(inventory.unitPrice ?? "");
  const [unit, setUnit] = useState(inventory.unit);
  const [category, setCategory] = useState(inventory.category ?? "");
  const [minimumStock, setMinimumStock] = useState(
    String(inventory.minimumStock)
  );
  const [currentStock, setCurrentStock] = useState(
    String(inventory.currentStock)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("品名は必須です");
      return;
    }
    const stockNum = Number(currentStock);
    if (isNaN(stockNum) || stockNum < 0) {
      setError("現在庫数を正しく入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProductAndInventory({
        productId: inventory.productId,
        name: name.trim(),
        productCode: productCode.trim() || undefined,
        modelNumber: modelNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        unitPrice: unitPrice.trim() || undefined,
        unit: unit.trim() || undefined,
        category: category.trim() || undefined,
        minimumStock: Number(minimumStock) || 0,
        currentStock: stockNum,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.modalTitle}>在庫情報の編集</h2>

        {error && <div className={s.formError}>{error}</div>}

        <div className={s.formGroup}>
          <label className={s.formLabel}>品名 *</label>
          <input
            type="text"
            className={s.formInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>品目コード</label>
            <input
              type="text"
              className={s.formInput}
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>型番</label>
            <input
              type="text"
              className={s.formInput}
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>メーカー</label>
            <input
              type="text"
              className={s.formInput}
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>カテゴリ</label>
            <input
              type="text"
              className={s.formInput}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>単価</label>
            <input
              type="number"
              className={s.formInput}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>単位</label>
            <input
              type="text"
              className={s.formInput}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>現在庫</label>
            <input
              type="number"
              className={s.formInput}
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              min="0"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>最低在庫</label>
            <input
              type="number"
              className={s.formInput}
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className={s.formActions}>
          <button
            className={s.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "更新中..." : "更新"}
          </button>
          <button className={s.btnSecondary} onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

export function InventoryClient({
  inventories,
}: {
  inventories: InventoryWithProduct[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryWithProduct | null>(
    null
  );

  return (
    <>
      <div className={s.pageHeader}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.75rem",
          }}
        >
          <h1 className={s.pageTitle}>在庫管理</h1>
          <span className={s.count}>{inventories.length} 件</span>
        </div>
        <button
          className={s.btnPrimary}
          onClick={() => setShowCreate(true)}
        >
          <AddRoundedIcon style={{ fontSize: 16 }} />
          新規追加
        </button>
      </div>

      <div className={s.tableWrap}>
        {inventories.length === 0 ? (
          <div className={s.empty}>在庫データがありません。</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>品目コード</th>
                <th>品名</th>
                <th>型番</th>
                <th className={s.textRight}>現在庫</th>
                <th className={s.textRight}>最低在庫</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.productCode ?? "—"}</td>
                  <td>
                    <Link
                      href={`/inventory/${inv.productId}`}
                      style={{ color: "var(--color-primary)", textDecoration: "none" }}
                    >
                      {inv.productName}
                    </Link>
                  </td>
                  <td>{inv.modelNumber ?? "—"}</td>
                  <td className={s.textRight}>
                    {inv.currentStock} {inv.unit}
                  </td>
                  <td className={s.textRight}>
                    {inv.minimumStock} {inv.unit}
                  </td>
                  <td>
                    <StockBadge
                      currentStock={inv.currentStock}
                      minimumStock={inv.minimumStock}
                    />
                  </td>
                  <td>
                    <button
                      className={s.btnIcon}
                      title="編集"
                      onClick={() => setEditTarget(inv)}
                    >
                      <EditRoundedIcon style={{ fontSize: 16 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateInventoryDialog onClose={() => setShowCreate(false)} />
      )}

      {editTarget && (
        <EditInventoryDialog
          inventory={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
