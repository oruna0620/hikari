"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, updateInvoice, createPayment, deletePayment } from "./actions";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import s from "../../_components/shared.module.css";

type Customer = {
  id: string;
  customerName: string;
  companyName: string | null;
};

type ItemRow = {
  itemName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
};

type Payment = {
  id: string;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
  paymentMethod: string | null;
  notes: string | null;
};

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
};

type InvoiceFormProps = {
  invoiceId?: string;
  invoiceNumber: string;
  customers: Customer[];
  taxRate: string;
  initialAttachments?: Attachment[];
  initial?: {
    customerId: string;
    title: string | null;
    issueDate: string;
    dueDate: string | null;
    notes: string | null;
    paymentStatus: string;
    items: {
      itemName: string;
      quantity: string;
      unit: string;
      unitPrice: string;
      amount: string;
    }[];
    payments: Payment[];
  };
};

const emptyItem: ItemRow = {
  itemName: "",
  quantity: "1",
  unit: "個",
  unitPrice: "0",
  amount: "0",
};

export function InvoiceForm({
  invoiceId,
  invoiceNumber,
  customers,
  taxRate,
  initialAttachments,
  initial,
}: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialAttachments ?? []
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [issueDate, setIssueDate] = useState(
    initial?.issueDate ?? new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [items, setItems] = useState<ItemRow[]>(
    initial?.items.map((it) => ({
      itemName: it.itemName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.amount,
    })) ?? [{ ...emptyItem }]
  );

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    expectedDate: "",
    expectedAmount: "",
    actualDate: "",
    actualAmount: "",
    paymentMethod: "",
    notes: "",
  });

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (invoiceId) formData.append("invoiceId", invoiceId);
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

  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );
  const rate = Number(taxRate) || 10;
  const taxAmount = Math.floor(subtotal * (rate / 100));
  const totalAmount = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      alert("顧客を選択してください");
      return;
    }
    setLoading(true);

    const data = {
      invoiceNumber,
      customerId,
      title: title || null,
      issueDate,
      dueDate: dueDate || null,
      subtotal: String(subtotal),
      taxRate,
      taxAmount: String(taxAmount),
      totalAmount: String(totalAmount),
      notes: notes || null,
    };

    const itemData = items.map((it, i) => ({
      sortOrder: i,
      itemName: it.itemName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      amount: it.amount,
    }));

    if (invoiceId) {
      await updateInvoice(invoiceId, data, itemData);
    } else {
      const attachmentIds = attachments.map((a) => a.id);
      await createInvoice(data, itemData, { attachmentIds });
    }

    router.push("/cashflow");
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId) return;
    setLoading(true);
    await createPayment({
      invoiceId,
      customerId,
      expectedDate: paymentForm.expectedDate || null,
      expectedAmount: paymentForm.expectedAmount || null,
      actualDate: paymentForm.actualDate || null,
      actualAmount: paymentForm.actualAmount || null,
      paymentMethod: paymentForm.paymentMethod || null,
      notes: paymentForm.notes || null,
    });
    setShowPaymentForm(false);
    setPaymentForm({
      expectedDate: "",
      expectedAmount: "",
      actualDate: "",
      actualAmount: "",
      paymentMethod: "",
      notes: "",
    });
    setLoading(false);
  }

  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>
          {invoiceId ? "請求書を編集" : "請求書を作成"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className={s.formCard}
          style={{ maxWidth: "100%", marginBottom: "1.5rem" }}
        >
          <div className={s.formGrid}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>請求番号</label>
              <input
                className={s.formInput}
                value={invoiceNumber}
                readOnly
                style={{ background: "var(--color-bg)" }}
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>顧客 *</label>
              <select
                className={s.formSelect}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
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
              <label className={s.formLabel}>支払期限</label>
              <input
                className={s.formInput}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
            <table className={s.table}>
              <thead>
                <tr>
                  <th>品名</th>
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

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
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
            onClick={() => router.push("/cashflow")}
          >
            キャンセル
          </button>
        </div>
      </form>

      {/* Payments section (only in edit mode) */}
      {invoiceId && initial?.payments && (
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
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>入金記録</h2>
            <button
              type="button"
              className={s.btnSecondary}
              onClick={() => setShowPaymentForm(true)}
            >
              <AddRoundedIcon style={{ fontSize: 16 }} />
              入金を追加
            </button>
          </div>

          {initial.payments.length === 0 ? (
            <div className={s.empty} style={{ padding: "2rem" }}>
              入金記録がありません。
            </div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>入金予定日</th>
                    <th className={s.textRight}>予定額</th>
                    <th>入金日</th>
                    <th className={s.textRight}>入金額</th>
                    <th>方法</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {initial.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.expectedDate ?? "—"}</td>
                      <td className={s.textRight}>
                        {p.expectedAmount
                          ? `¥${Number(p.expectedAmount).toLocaleString()}`
                          : "—"}
                      </td>
                      <td>{p.actualDate ?? "—"}</td>
                      <td className={s.textRight}>
                        {p.actualAmount
                          ? `¥${Number(p.actualAmount).toLocaleString()}`
                          : "—"}
                      </td>
                      <td>{p.paymentMethod ?? "—"}</td>
                      <td>
                        <button
                          className={s.btnIcon}
                          onClick={async () => {
                            if (!confirm("この入金記録を削除しますか？"))
                              return;
                            await deletePayment(p.id, invoiceId);
                          }}
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
      )}

      {/* Payment modal */}
      {showPaymentForm && (
        <div
          className={s.overlay}
          onClick={() => setShowPaymentForm(false)}
        >
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.modalTitle}>入金を追加</h2>
            <form onSubmit={handleAddPayment}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>入金予定日</label>
                  <input
                    className={s.formInput}
                    type="date"
                    value={paymentForm.expectedDate}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        expectedDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>予定額</label>
                  <input
                    className={s.formInput}
                    type="number"
                    value={paymentForm.expectedAmount}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        expectedAmount: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>入金日</label>
                  <input
                    className={s.formInput}
                    type="date"
                    value={paymentForm.actualDate}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        actualDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>入金額</label>
                  <input
                    className={s.formInput}
                    type="number"
                    value={paymentForm.actualAmount}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        actualAmount: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>入金方法</label>
                  <select
                    className={s.formSelect}
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        paymentMethod: e.target.value,
                      }))
                    }
                  >
                    <option value="">選択してください</option>
                    <option value="振込">振込</option>
                    <option value="現金">現金</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>備考</label>
                  <textarea
                    className={s.formTextarea}
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className={s.formActions}>
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
                  onClick={() => setShowPaymentForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
