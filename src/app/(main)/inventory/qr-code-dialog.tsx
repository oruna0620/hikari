"use client";

import { useState, useEffect } from "react";
import s from "../../_components/shared.module.css";
import { createQrCode, getQrCodes, deactivateQrCode } from "./actions";
import type { InventoryWithProduct } from "./actions";

type QrCodeRow = {
  id: string;
  productId: string;
  code: string;
  label: string | null;
  isActive: boolean;
  createdAt: Date;
};

type Props = {
  inventories: InventoryWithProduct[];
  onClose: () => void;
};

export function QrCodeDialog({ inventories, onClose }: Props) {
  const [selectedProductId, setSelectedProductId] = useState(
    inventories[0]?.productId ?? ""
  );
  const [qrCodes, setQrCodes] = useState<QrCodeRow[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProductId) {
      getQrCodes(selectedProductId).then((codes) =>
        setQrCodes(codes as QrCodeRow[])
      );
    }
  }, [selectedProductId]);

  const handleCreate = async () => {
    if (!selectedProductId) return;
    setLoading(true);
    try {
      const created = await createQrCode(selectedProductId, label || undefined);
      setQrCodes((prev) => [created as QrCodeRow, ...prev]);
      setLabel("");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("このQRコードを無効にしますか？")) return;
    await deactivateQrCode(id);
    setQrCodes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isActive: false } : q))
    );
  };

  const showQr = async (code: string) => {
    const { generateQRCodeDataURL } = await import("@/lib/qrcode/generate");
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://hikari.example.com";
    const url = `${appUrl}/liff/inventory?code=${encodeURIComponent(code)}`;
    const dataUrl = await generateQRCodeDataURL(url);
    setQrImageUrl(dataUrl);
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div
        className={s.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <h2 className={s.modalTitle}>QRコード管理</h2>

        <div className={s.formGroup}>
          <label className={s.formLabel}>商品</label>
          <select
            className={s.formSelect}
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setQrImageUrl(null);
            }}
          >
            {inventories.map((inv) => (
              <option key={inv.productId} value={inv.productId}>
                {inv.productName}
                {inv.modelNumber ? ` (${inv.modelNumber})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <input
            className={s.formInput}
            placeholder="ラベル（任意）"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className={s.btnPrimary}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "生成中..." : "QR生成"}
          </button>
        </div>

        {qrImageUrl && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "1rem",
              padding: "1rem",
              background: "#f8fafc",
              borderRadius: "var(--radius)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="QR Code"
              style={{ width: 200, height: 200 }}
            />
            <div style={{ marginTop: "0.5rem" }}>
              <button
                className={s.btnSecondary}
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = qrImageUrl;
                  link.download = "qrcode.png";
                  link.click();
                }}
              >
                ダウンロード
              </button>
            </div>
          </div>
        )}

        {qrCodes.length > 0 && (
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              既存QRコード
            </div>
            {qrCodes.map((qr) => (
              <div
                key={qr.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid var(--color-border-light)",
                  opacity: qr.isActive ? 1 : 0.5,
                }}
              >
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                    {qr.code}
                  </div>
                  {qr.label && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {qr.label}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {qr.isActive && (
                    <>
                      <button
                        className={s.btnIcon}
                        onClick={() => showQr(qr.code)}
                        title="QRコード表示"
                      >
                        QR
                      </button>
                      <button
                        className={s.btnIcon}
                        onClick={() => handleDeactivate(qr.id)}
                        title="無効化"
                        style={{ color: "#dc2626" }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {!qr.isActive && (
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      無効
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={s.formActions}>
          <button className={s.btnSecondary} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
