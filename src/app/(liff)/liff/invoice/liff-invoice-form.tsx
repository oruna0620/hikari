"use client";

import { useState } from "react";
import { LiffProvider, useLiff } from "../_components/liff-provider";
import s from "../_components/liff.module.css";

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
};

type Props = {
  customers: Customer[];
  taxRate: string;
};

function InvoiceFormInner({ customers, taxRate }: Props) {
  const { isReady, isLoggedIn, error: authError, accessToken } = useLiff();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { itemName: "", quantity: "1", unit: "個", unitPrice: "0" },
  ]);

  if (!isReady) {
    return <div className={s.loading}>読み込み中...</div>;
  }

  if (authError) {
    return (
      <div className={s.container}>
        <div className={s.error}>{authError}</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <div className={s.loading}>ログイン中...</div>;
  }

  const updateItem = (idx: number, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );
  const taxAmount = Math.floor(subtotal * (Number(taxRate) / 100));
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!customerId) {
      setError("顧客を選択してください");
      return;
    }
    if (items.every((it) => !it.itemName)) {
      setError("明細を入力してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/liff/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          customerId,
          title: title || null,
          issueDate,
          dueDate: dueDate || null,
          notes: notes || null,
          taxRate,
          items: items
            .filter((it) => it.itemName)
            .map((it) => ({
              itemName: it.itemName,
              quantity: Number(it.quantity),
              unit: it.unit,
              unitPrice: Number(it.unitPrice),
            })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "作成に失敗しました");
      }

      const data = await res.json();
      setSuccess(
        `請求書 ${data.invoiceNumber} を作成しました（¥${Number(data.totalAmount).toLocaleString()}）`
      );

      setCustomerId("");
      setTitle("");
      setNotes("");
      setItems([{ itemName: "", quantity: "1", unit: "個", unitPrice: "0" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1 className={s.title}>請求書作成</h1>
        <p className={s.subtitle}>LINE から請求書を作成</p>
      </div>

      {error && <div className={s.error}>{error}</div>}
      {success && <div className={s.success}>{success}</div>}

      <div className={s.formGroup}>
        <label className={s.label}>顧客</label>
        <select
          className={s.select}
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
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

      <div className={s.formGroup}>
        <label className={s.label}>件名</label>
        <input
          className={s.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="工事名など"
        />
      </div>

      <div className={s.row}>
        <div className={s.formGroup}>
          <label className={s.label}>発行日</label>
          <input
            type="date"
            className={s.input}
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </div>
        <div className={s.formGroup}>
          <label className={s.label}>支払期限</label>
          <input
            type="date"
            className={s.input}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className={s.formGroup}>
        <label className={s.label}>明細</label>
        {items.map((item, idx) => (
          <div key={idx} className={s.card}>
            <div className={s.cardHeader}>
              <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                明細 {idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  className={s.btnDanger}
                  onClick={() =>
                    setItems((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  ✕
                </button>
              )}
            </div>
            <div className={s.formGroup}>
              <input
                className={s.input}
                placeholder="品名"
                value={item.itemName}
                onChange={(e) => updateItem(idx, "itemName", e.target.value)}
              />
            </div>
            <div className={s.row}>
              <div className={s.formGroup}>
                <label className={s.label}>数量</label>
                <input
                  type="number"
                  className={s.input}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  min="1"
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>単価</label>
                <input
                  type="number"
                  className={s.input}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          className={s.addItemBtn}
          onClick={() =>
            setItems((prev) => [
              ...prev,
              { itemName: "", quantity: "1", unit: "個", unitPrice: "0" },
            ])
          }
        >
          ＋ 明細を追加
        </button>
      </div>

      <div className={s.totals}>
        <div className={s.totalRow}>
          <span>小計</span>
          <span>¥{subtotal.toLocaleString()}</span>
        </div>
        <div className={s.totalRow}>
          <span>消費税 ({taxRate}%)</span>
          <span>¥{taxAmount.toLocaleString()}</span>
        </div>
        <div className={s.totalRowMain}>
          <span>合計</span>
          <span>¥{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className={s.formGroup}>
        <label className={s.label}>備考</label>
        <textarea
          className={s.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="補足事項"
        />
      </div>

      <button
        className={s.btnPrimary}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "作成中..." : "請求書を作成"}
      </button>
    </div>
  );
}

export function LiffInvoiceForm(props: Props) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID ?? "";
  return (
    <LiffProvider liffId={liffId}>
      <InvoiceFormInner {...props} />
    </LiffProvider>
  );
}
