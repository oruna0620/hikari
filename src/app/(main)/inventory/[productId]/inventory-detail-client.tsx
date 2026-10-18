"use client";

import { useState } from "react";
import Link from "next/link";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import s from "../../../_components/shared.module.css";
import { InventoryMovementDialog } from "../inventory-movement-dialog";
import { updateProductAndInventory } from "../actions";

type Product = {
  id: string;
  productCode: string | null;
  name: string;
  modelNumber: string | null;
  manufacturer: string | null;
  unitPrice: string;
  unit: string;
  category: string | null;
};

type Inventory = {
  id: string;
  productId: string;
  currentStock: number;
  minimumStock: number;
  lastUpdatedAt: Date;
};

type History = {
  id: string;
  type: string;
  quantity: number;
  stockAfter: number;
  operatedAt: Date;
  notes: string | null;
  isCancelled: boolean;
};

const typeLabels: Record<string, string> = {
  in: "入庫",
  out: "出庫",
  adjust: "棚卸",
};

function TypeBadge({ type }: { type: string }) {
  const cls =
    type === "in"
      ? s.badgeAccepted
      : type === "out"
        ? s.badgeRejected
        : s.badgeSent;
  return <span className={cls}>{typeLabels[type] ?? type}</span>;
}

function StockStatusBadge({
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

function EditProductDialog({
  product,
  currentStock: initialCurrentStock,
  minimumStock,
  onClose,
}: {
  product: Product;
  currentStock: number;
  minimumStock: number;
  onClose: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [productCode, setProductCode] = useState(product.productCode ?? "");
  const [modelNumber, setModelNumber] = useState(product.modelNumber ?? "");
  const [manufacturer, setManufacturer] = useState(
    product.manufacturer ?? ""
  );
  const [unitPrice, setUnitPrice] = useState(product.unitPrice ?? "");
  const [unit, setUnit] = useState(product.unit);
  const [category, setCategory] = useState(product.category ?? "");
  const [minStock, setMinStock] = useState(String(minimumStock));
  const [curStock, setCurStock] = useState(String(initialCurrentStock));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("品名は必須です");
      return;
    }
    const stockNum = Number(curStock);
    if (isNaN(stockNum) || stockNum < 0) {
      setError("現在庫数を正しく入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProductAndInventory({
        productId: product.id,
        name: name.trim(),
        productCode: productCode.trim() || undefined,
        modelNumber: modelNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        unitPrice: unitPrice.trim() || undefined,
        unit: unit.trim() || undefined,
        category: category.trim() || undefined,
        minimumStock: Number(minStock) || 0,
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
        <h2 className={s.modalTitle}>商品情報の編集</h2>

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
              value={curStock}
              onChange={(e) => setCurStock(e.target.value)}
              min="0"
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>最低在庫</label>
            <input
              type="number"
              className={s.formInput}
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
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

export function InventoryDetailClient({
  product,
  inventory,
  histories,
}: {
  product: Product;
  inventory: Inventory | null;
  histories: History[];
}) {
  const [showMovement, setShowMovement] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const handleShowQr = async () => {
    const { generateQRCodeDataURL } = await import("@/lib/qrcode/generate");
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://hikari.example.com";
    const url = `${appUrl}/liff/inventory?code=HIK-${product.id.slice(0, 8)}`;
    const dataUrl = await generateQRCodeDataURL(url);
    setQrImageUrl(dataUrl);
    setShowQr(true);
  };

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/inventory"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <ArrowBackRoundedIcon style={{ fontSize: 14 }} />
          在庫一覧に戻る
        </Link>
      </div>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>{product.name}</h1>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            {product.productCode && `${product.productCode} / `}
            {product.modelNumber ?? ""}
            {product.manufacturer ? ` / ${product.manufacturer}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={s.btnSecondary}
            onClick={() => setShowEdit(true)}
          >
            <EditRoundedIcon style={{ fontSize: 16 }} />
            編集
          </button>
          <button
            className={s.btnPrimary}
            onClick={() => setShowMovement(true)}
          >
            <InventoryRoundedIcon style={{ fontSize: 16 }} />
            在庫操作
          </button>
          <button className={s.btnSecondary} onClick={handleShowQr}>
            <QrCode2RoundedIcon style={{ fontSize: 16 }} />
            QRコード
          </button>
        </div>
      </div>

      {/* Stock summary */}
      <div className={s.summaryRow}>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>現在庫</div>
          <div className={s.summaryValue}>
            {inventory?.currentStock ?? 0} {product.unit}
          </div>
        </div>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>最低在庫</div>
          <div className={s.summaryValue}>
            {inventory?.minimumStock ?? 0} {product.unit}
          </div>
        </div>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>状態</div>
          <div style={{ marginTop: "0.375rem" }}>
            {inventory ? (
              <StockStatusBadge
                currentStock={inventory.currentStock}
                minimumStock={inventory.minimumStock}
              />
            ) : (
              <span className={s.badgeDraft}>未登録</span>
            )}
          </div>
        </div>
      </div>

      {/* History table */}
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
        }}
      >
        入出庫履歴
      </h2>
      <div className={s.tableWrap}>
        {histories.length === 0 ? (
          <div className={s.empty}>履歴がありません。</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>日時</th>
                <th>種別</th>
                <th className={s.textRight}>数量</th>
                <th className={s.textRight}>操作後在庫</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {histories.map((h) => (
                <tr
                  key={h.id}
                  style={{
                    opacity: h.isCancelled ? 0.5 : 1,
                    textDecoration: h.isCancelled ? "line-through" : "none",
                  }}
                >
                  <td>
                    {new Date(h.operatedAt).toLocaleString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <TypeBadge type={h.type} />
                  </td>
                  <td className={s.textRight}>
                    {h.type === "in" ? "+" : h.type === "out" ? "-" : ""}
                    {h.quantity}
                  </td>
                  <td className={s.textRight}>{h.stockAfter}</td>
                  <td>{h.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit dialog */}
      {showEdit && (
        <EditProductDialog
          product={product}
          currentStock={inventory?.currentStock ?? 0}
          minimumStock={inventory?.minimumStock ?? 0}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Movement dialog — works even when inventory is null (first stock-in) */}
      {showMovement && (
        <InventoryMovementDialog
          inventory={{
            id: inventory?.id ?? "",
            productId: product.id,
            productCode: product.productCode,
            productName: product.name,
            modelNumber: product.modelNumber,
            unit: product.unit,
            currentStock: inventory?.currentStock ?? 0,
            minimumStock: inventory?.minimumStock ?? 0,
            lastUpdatedAt: inventory?.lastUpdatedAt ?? new Date(),
            manufacturer: product.manufacturer,
            unitPrice: product.unitPrice,
            category: product.category,
          }}
          onClose={() => setShowMovement(false)}
        />
      )}

      {/* QR code modal */}
      {showQr && qrImageUrl && (
        <div className={s.overlay} onClick={() => setShowQr(false)}>
          <div
            className={s.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "center" }}
          >
            <h2 className={s.modalTitle}>QRコード</h2>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 600 }}>{product.name}</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="QR Code"
              style={{ width: 200, height: 200 }}
            />
            <div className={s.formActions} style={{ justifyContent: "center" }}>
              <button
                className={s.btnPrimary}
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = qrImageUrl;
                  link.download = `qr-${product.productCode ?? product.id}.png`;
                  link.click();
                }}
              >
                ダウンロード
              </button>
              <button
                className={s.btnSecondary}
                onClick={() => window.print()}
              >
                印刷
              </button>
              <button
                className={s.btnSecondary}
                onClick={() => setShowQr(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
