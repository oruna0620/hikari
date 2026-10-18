"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createEstimate, updateEstimate } from "./actions";
import type { EstimateItemData } from "./actions";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import s from "../../_components/shared.module.css";

type Customer = {
  id: string;
  customerName: string;
  companyName: string | null;
};

type Product = {
  id: string;
  name: string;
  modelNumber: string | null;
  unitPrice: string;
  unit: string;
};

type ItemRow = {
  productId: string | null;
  itemName: string;
  modelNumber: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
};

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
};

type EstimateFormProps = {
  estimateId?: string;
  estimateNumber: string;
  customers: Customer[];
  products: Product[];
  taxRate: string;
  initialAttachments?: Attachment[];
  initial?: {
    customerId: string | null;
    customerName: string | null;
    title: string | null;
    issueDate: string;
    expiryDate: string | null;
    notes: string | null;
    status: string;
    items: {
      productId: string | null;
      itemName: string;
      modelNumber: string | null;
      quantity: string;
      unit: string;
      unitPrice: string;
      amount: string;
    }[];
  };
};

const emptyItem: ItemRow = {
  productId: null,
  itemName: "",
  modelNumber: "",
  quantity: "1",
  unit: "個",
  unitPrice: "0",
  amount: "0",
};

export function EstimateForm({
  estimateId,
  estimateNumber,
  customers,
  products,
  taxRate,
  initialAttachments,
  initial,
}: EstimateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialAttachments ?? []
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [customerName, setCustomerName] = useState(
    initial?.customerName ?? ""
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [issueDate, setIssueDate] = useState(
    initial?.issueDate ?? new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");

  const [items, setItems] = useState<ItemRow[]>(
    initial?.items.map((it) => ({
      productId: it.productId,
      itemName: it.itemName,
      modelNumber: it.modelNumber ?? "",
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.amount,
    })) ?? [{ ...emptyItem }]
  );

  function recalcItem(item: ItemRow): ItemRow {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return { ...item, amount: String(qty * price) };
  }

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = recalcItem({ ...updated[idx], ...patch });
      return updated;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function selectProduct(idx: number, productId: string) {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      updateItem(idx, {
        productId: prod.id,
        itemName: prod.name,
        modelNumber: prod.modelNumber ?? "",
        unitPrice: prod.unitPrice,
        unit: prod.unit,
      });
    } else {
      updateItem(idx, { productId: null });
    }
  }

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c) {
      setCustomerName(
        c.companyName ? `${c.companyName} / ${c.customerName}` : c.customerName
      );
    } else {
      setCustomerName("");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (estimateId) formData.append("estimateId", estimateId);
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const doc = await res.json();
          setAttachments((prev) => [...prev, doc]);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment(id: string) {
    if (!confirm("この添付ファイルを削除しますか？")) return;
    const res = await fetch("/api/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const rate = Number(taxRate) || 10;
  const taxAmount = Math.floor(subtotal * (rate / 100));
  const totalAmount = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const data = {
      estimateNumber,
      customerId: customerId || null,
      customerName: customerName || null,
      title: title || null,
      issueDate,
      expiryDate: expiryDate || null,
      subtotal: String(subtotal),
      taxRate,
      taxAmount: String(taxAmount),
      totalAmount: String(totalAmount),
      notes: notes || null,
      status,
    };

    const itemData: EstimateItemData[] = items.map((it, i) => ({
      sortOrder: i,
      productId: it.productId,
      itemName: it.itemName,
      modelNumber: it.modelNumber || null,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.amount,
    }));

    if (estimateId) {
      await updateEstimate(estimateId, data, itemData);
    } else {
      const attachmentIds = attachments.map((a) => a.id);
      await createEstimate(data, itemData, { attachmentIds });
    }

    router.push("/estimates");
  }

  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>
          {estimateId ? "見積もりを編集" : "見積もりを作成"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className={s.formCard}
          style={{ maxWidth: "100%", marginBottom: "1.5rem" }}
        >
          <div className={s.formGrid}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>見積番号</label>
              <input
                className={s.formInput}
                value={estimateNumber}
                readOnly
                style={{ background: "var(--color-bg)" }}
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>状態</label>
              <select
                className={s.formSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">下書き</option>
                <option value="sent">送付済</option>
                <option value="accepted">受注</option>
                <option value="rejected">失注</option>
              </select>
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>顧客</label>
              <select
                className={s.formSelect}
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">選択してください</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName
                      ? `${c.companyName} / ${c.customerName}`
                      : c.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.formGroupFull}>
              <label className={s.formLabel}>件名</label>
              <input
                className={s.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>発行日</label>
              <input
                className={s.formInput}
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>有効期限</label>
              <input
                className={s.formInput}
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div
          className={s.formCard}
          style={{ maxWidth: "100%", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>明細</h2>
            <button
              type="button"
              className={s.btnSecondary}
              onClick={addItem}
            >
              <AddRoundedIcon style={{ fontSize: 16 }} />
              行を追加
            </button>
          </div>

          <div className={s.tableWrap}>
            <table className={s.table} style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ width: 160 }}>品目選択</th>
                  <th>品名</th>
                  <th style={{ width: 100 }}>型番</th>
                  <th style={{ width: 80 }}>数量</th>
                  <th style={{ width: 60 }}>単位</th>
                  <th style={{ width: 100 }}>単価</th>
                  <th className={s.textRight} style={{ width: 100 }}>
                    金額
                  </th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className={s.formSelect}
                        style={{ fontSize: "0.75rem", padding: "0.375rem" }}
                        value={item.productId ?? ""}
                        onChange={(e) => selectProduct(idx, e.target.value)}
                      >
                        <option value="">手入力</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className={s.formInput}
                        style={{ fontSize: "0.75rem", padding: "0.375rem" }}
                        value={item.itemName}
                        onChange={(e) =>
                          updateItem(idx, { itemName: e.target.value })
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        className={s.formInput}
                        style={{ fontSize: "0.75rem", padding: "0.375rem" }}
                        value={item.modelNumber}
                        onChange={(e) =>
                          updateItem(idx, { modelNumber: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className={s.formInput}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.375rem",
                          textAlign: "right",
                        }}
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, { quantity: e.target.value })
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        className={s.formInput}
                        style={{ fontSize: "0.75rem", padding: "0.375rem" }}
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(idx, { unit: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className={s.formInput}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.375rem",
                          textAlign: "right",
                        }}
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(idx, { unitPrice: e.target.value })
                        }
                        required
                      />
                    </td>
                    <td
                      className={s.textRight}
                      style={{ fontSize: "0.8125rem" }}
                    >
                      ¥{Number(item.amount).toLocaleString()}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className={s.btnIcon}
                          onClick={() => removeItem(idx)}
                        >
                          <DeleteRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1rem",
            }}
          >
            <div style={{ minWidth: 200 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.375rem 0",
                  fontSize: "0.8125rem",
                }}
              >
                <span style={{ color: "var(--color-text-secondary)" }}>
                  小計
                </span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.375rem 0",
                  fontSize: "0.8125rem",
                }}
              >
                <span style={{ color: "var(--color-text-secondary)" }}>
                  消費税 ({rate}%)
                </span>
                <span>¥{taxAmount.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderTop: "2px solid var(--color-border)",
                }}
              >
                <span>合計</span>
                <span>¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div
          className={s.formCard}
          style={{ maxWidth: "100%", marginBottom: "1.5rem" }}
        >
          <div className={s.formGroupFull}>
            <label className={s.formLabel}>備考</label>
            <textarea
              className={s.formTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Attachments */}
        <div
          className={s.formCard}
          style={{ maxWidth: "100%", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>添付ファイル</h2>
            <label
              className={s.btnSecondary}
              style={{ cursor: "pointer" }}
            >
              <AttachFileRoundedIcon style={{ fontSize: 16 }} />
              {uploading ? "アップロード中..." : "ファイルを追加"}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {attachments.length === 0 ? (
            <div className={s.empty} style={{ padding: "2rem" }}>
              添付ファイルがありません。
            </div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>ファイル名</th>
                    <th style={{ width: 80 }}>種類</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <a
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-primary)", textDecoration: "underline" }}
                        >
                          {a.fileName}
                        </a>
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        {a.fileType.toUpperCase()}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={s.btnIcon}
                          onClick={() => handleDeleteAttachment(a.id)}
                        >
                          <DeleteRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            className={s.btnSecondary}
            onClick={() => router.push("/estimates")}
          >
            キャンセル
          </button>
        </div>
      </form>
    </>
  );
}
