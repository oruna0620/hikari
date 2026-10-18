"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  deleteInvoice,
  createInvoiceFromExtraction,
  createExpenseFromExtraction,
} from "./actions";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Link from "next/link";
import s from "../../_components/shared.module.css";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  title: string | null;
  issueDate: string;
  dueDate: string | null;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: string;
};

type Expense = {
  id: string;
  payeeName: string;
  customerId: string | null;
  category: string | null;
  title: string | null;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  notes: string | null;
};

type Customer = {
  id: string;
  customerName: string;
  companyName: string | null;
};


type ExpenseForm = {
  payeeName: string;
  customerId: string | null;
  category: string | null;
  title: string | null;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  notes: string | null;
};

type ExtractedLineItem = {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

type ExtractedInvoiceData = {
  vendorName: string;
  issueDate: string | null;
  dueDate: string | null;
  items: ExtractedLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
};

type UploadDocType = "sales" | "purchase";

const emptyExpense: ExpenseForm = {
  payeeName: "",
  customerId: null,
  category: null,
  title: null,
  expectedDate: null,
  expectedAmount: null,
  actualDate: null,
  actualAmount: null,
  paymentStatus: "unpaid",
  paymentMethod: null,
  notes: null,
};

const statusLabels: Record<string, string> = {
  unpaid: "未払い",
  partial: "一部入金",
  paid: "支払済",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? s.badgePaid
      : status === "partial"
        ? s.badgePartial
        : s.badgeUnpaid;
  return <span className={cls}>{statusLabels[status] ?? status}</span>;
}

const tabs = ["請求書", "出金・支払い"] as const;

function getYearMonth(dateStr: string | null): string | null {
  if (!dateStr) return null;
  // "YYYY-MM-DD" → "YYYY-MM"
  return dateStr.slice(0, 7);
}

function formatYearMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function CashflowClient({
  invoices,
  expenses,
  customers,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  customers: Customer[];
}) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [tab, setTab] = useState<(typeof tabs)[number]>("請求書");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpense);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadDocType, setUploadDocType] = useState<UploadDocType>("sales");
  const [showExtractPreview, setShowExtractPreview] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [extractedDocId, setExtractedDocId] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  // Editable extraction form state
  const [exVendorName, setExVendorName] = useState("");
  const [exIssueDate, setExIssueDate] = useState("");
  const [exDueDate, setExDueDate] = useState("");
  const [exItems, setExItems] = useState<ExtractedLineItem[]>([]);
  const [exSubtotal, setExSubtotal] = useState(0);
  const [exTaxAmount, setExTaxAmount] = useState(0);
  const [exTotalAmount, setExTotalAmount] = useState(0);
  const [exCustomerId, setExCustomerId] = useState("");
  const [exCategory, setExCategory] = useState("仕入");
  const [savingExtraction, setSavingExtraction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedYM = `${year}-${String(month).padStart(2, "0")}`;

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) => getYearMonth(inv.dueDate ?? inv.issueDate) === selectedYM
      ),
    [invoices, selectedYM]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter(
        (ex) =>
          getYearMonth(ex.actualDate) === selectedYM ||
          (!ex.actualDate && getYearMonth(ex.expectedDate) === selectedYM)
      ),
    [expenses, selectedYM]
  );

  const incomeTotal = useMemo(
    () =>
      filteredInvoices.reduce(
        (sum, inv) =>
          sum +
          (Number(inv.paidAmount) > 0
            ? Number(inv.paidAmount)
            : Number(inv.totalAmount)),
        0
      ),
    [filteredInvoices]
  );

  const expenseTotal = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, ex) => sum + Number(ex.actualAmount ?? ex.expectedAmount ?? 0),
        0
      ),
    [filteredExpenses]
  );

  const netAmount = incomeTotal - expenseTotal;

  const yearlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const ym = `${year}-${String(m).padStart(2, "0")}`;

      const mInvoices = invoices.filter(
        (inv) => getYearMonth(inv.dueDate ?? inv.issueDate) === ym
      );
      const mExpenses = expenses.filter(
        (ex) =>
          getYearMonth(ex.actualDate) === ym ||
          (!ex.actualDate && getYearMonth(ex.expectedDate) === ym)
      );

      const income = mInvoices.reduce(
        (sum, inv) =>
          sum +
          (Number(inv.paidAmount) > 0
            ? Number(inv.paidAmount)
            : Number(inv.totalAmount)),
        0
      );
      const expense = mExpenses.reduce(
        (sum, ex) => sum + Number(ex.actualAmount ?? ex.expectedAmount ?? 0),
        0
      );

      return { month: m, income, expense, net: income - expense };
    });

    const totals = months.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expense: acc.expense + m.expense,
        net: acc.net + m.net,
      }),
      { income: 0, expense: 0, net: 0 }
    );

    return { months, totals };
  }, [invoices, expenses, year]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function openCreateExpense() {
    setEditingExpense(null);
    setExpenseForm(emptyExpense);
    setShowExpenseForm(true);
  }

  function openEditExpense(ex: Expense) {
    setEditingExpense(ex);
    setExpenseForm({
      payeeName: ex.payeeName,
      customerId: ex.customerId,
      category: ex.category,
      title: ex.title,
      expectedDate: ex.expectedDate,
      expectedAmount: ex.expectedAmount,
      actualDate: ex.actualDate,
      actualAmount: ex.actualAmount,
      paymentStatus: ex.paymentStatus,
      paymentMethod: ex.paymentMethod,
      notes: ex.notes,
    });
    setShowExpenseForm(true);
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseForm);
    } else {
      await createExpense(expenseForm);
    }
    setShowExpenseForm(false);
    setLoading(false);
  }

  function setExp(key: keyof ExpenseForm, value: string) {
    setExpenseForm((f) => ({ ...f, [key]: value || null }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setShowTypeSelect(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUploadWithType() {
    if (pendingFiles.length === 0) return;
    setShowTypeSelect(false);
    setUploading(true);
    setExtractError(null);
    try {
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) continue;

        // Trigger AI extraction
        setExtracting(true);
        try {
          const extractRes = await fetch(
            `/api/uploads/${uploadData.id}/extract`,
            { method: "POST" }
          );
          const extractResult = await extractRes.json();
          if (extractRes.ok && !extractResult.error) {
            // Open preview with extracted data
            setExtractedData(extractResult);
            setExtractedDocId(uploadData.id);
            setExVendorName(extractResult.vendorName ?? "");
            setExIssueDate(extractResult.issueDate ?? "");
            setExDueDate(extractResult.dueDate ?? "");
            setExItems(extractResult.items ?? []);
            setExSubtotal(extractResult.subtotal ?? 0);
            setExTaxAmount(extractResult.taxAmount ?? 0);
            setExTotalAmount(extractResult.totalAmount ?? 0);
            setExCustomerId("");
            setExCategory("仕入");
            setShowExtractPreview(true);
          } else {
            setExtractError(extractResult.error ?? "抽出に失敗しました");
          }
        } catch {
          setExtractError("AI抽出中にエラーが発生しました");
        }
        setExtracting(false);
      }
      router.refresh();
    } finally {
      setUploading(false);
      setPendingFiles([]);
    }
  }

  function recalcTotals(items: ExtractedLineItem[]) {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = Math.round(subtotal * 0.1);
    setExSubtotal(subtotal);
    setExTaxAmount(taxAmount);
    setExTotalAmount(subtotal + taxAmount);
  }

  function updateItem(index: number, field: keyof ExtractedLineItem, value: string) {
    setExItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === "itemName") {
        item.itemName = value;
      } else {
        const num = Number(value) || 0;
        (item as Record<string, unknown>)[field] = num;
        if (field === "quantity" || field === "unitPrice") {
          item.amount = item.quantity * item.unitPrice;
        }
      }
      next[index] = item;
      recalcTotals(next);
      return next;
    });
  }

  function removeItem(index: number) {
    setExItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      recalcTotals(next);
      return next;
    });
  }

  function addItem() {
    setExItems((prev) => [
      ...prev,
      { itemName: "", quantity: 1, unit: "個", unitPrice: 0, amount: 0 },
    ]);
  }

  async function handleSaveExtraction() {
    if (!extractedDocId) return;
    setSavingExtraction(true);
    try {
      if (uploadDocType === "sales") {
        if (!exCustomerId) {
          alert("顧客を選択してください");
          setSavingExtraction(false);
          return;
        }
        await createInvoiceFromExtraction({
          documentId: extractedDocId,
          customerId: exCustomerId,
          title: exVendorName ? `${exVendorName}からの請求` : null,
          issueDate: exIssueDate || new Date().toISOString().slice(0, 10),
          dueDate: exDueDate || null,
          subtotal: String(exSubtotal),
          taxRate: "10.00",
          taxAmount: String(exTaxAmount),
          totalAmount: String(exTotalAmount),
          notes: null,
          items: exItems.map((item, i) => ({
            sortOrder: i + 1,
            itemName: item.itemName || "明細",
            quantity: String(item.quantity),
            unit: item.unit || "個",
            unitPrice: String(item.unitPrice),
            amount: String(item.amount),
          })),
        });
      } else {
        await createExpenseFromExtraction({
          documentId: extractedDocId,
          payeeName: exVendorName || "不明",
          category: exCategory,
          title: exItems.length > 0 ? exItems[0].itemName : null,
          expectedDate: exDueDate || exIssueDate || null,
          expectedAmount: String(exTotalAmount),
          notes: null,
        });
      }
      setShowExtractPreview(false);
      setExtractedData(null);
      setExtractedDocId(null);
      router.refresh();
    } finally {
      setSavingExtraction(false);
    }
  }

  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>入出金管理</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {tab === "請求書" ? (
            <>
              <label className={s.btnSecondary} style={{ cursor: "pointer" }}>
                <UploadFileRoundedIcon style={{ fontSize: 16 }} />
                {uploading
                  ? "アップロード中..."
                  : extracting
                    ? "AI抽出中..."
                    : "請求書をアップロード"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  disabled={uploading || extracting}
                />
              </label>
              <Link href="/cashflow/invoices/new" className={s.btnPrimary}>
                <AddRoundedIcon style={{ fontSize: 16 }} />
                請求書を作成
              </Link>
            </>
          ) : (
            <button className={s.btnPrimary} onClick={openCreateExpense}>
              <AddRoundedIcon style={{ fontSize: 16 }} />
              出金を追加
            </button>
          )}
        </div>
      </div>

      {/* View mode toggle + period selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{
          display: "inline-flex",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}>
          {(["monthly", "yearly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: viewMode === mode ? 600 : 400,
                color: viewMode === mode ? "#fff" : "var(--color-text-secondary)",
                background: viewMode === mode ? "var(--color-primary)" : "var(--color-surface)",
                transition: "all 0.15s",
              }}
            >
              {mode === "monthly" ? "月別" : "年間"}
            </button>
          ))}
        </div>

        <div className={s.monthSelector} style={{ marginBottom: 0 }}>
          <button className={s.monthBtn} onClick={() => {
            if (viewMode === "yearly") setYear((y) => y - 1);
            else prevMonth();
          }}>
            <ChevronLeftRoundedIcon style={{ fontSize: 20 }} />
          </button>
          <span className={s.monthLabel}>
            {viewMode === "yearly" ? `${year}年` : formatYearMonth(year, month)}
          </span>
          <button className={s.monthBtn} onClick={() => {
            if (viewMode === "yearly") setYear((y) => y + 1);
            else nextMonth();
          }}>
            <ChevronRightRoundedIcon style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      {/* Summary */}
      {viewMode === "monthly" ? (
        <div className={s.summaryRow}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>入金合計</div>
            <div className={`${s.summaryValue} ${s.summaryIncome}`}>
              ¥{incomeTotal.toLocaleString()}
            </div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>出金合計</div>
            <div className={`${s.summaryValue} ${s.summaryExpense}`}>
              ¥{expenseTotal.toLocaleString()}
            </div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>収支</div>
            <div
              className={`${s.summaryValue} ${
                netAmount >= 0 ? s.summaryNetPositive : s.summaryNetNegative
              }`}
            >
              {netAmount >= 0 ? "+" : ""}¥{netAmount.toLocaleString()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={s.summaryRow}>
            <div className={s.summaryCard}>
              <div className={s.summaryLabel}>年間 入金合計</div>
              <div className={`${s.summaryValue} ${s.summaryIncome}`}>
                ¥{yearlyData.totals.income.toLocaleString()}
              </div>
            </div>
            <div className={s.summaryCard}>
              <div className={s.summaryLabel}>年間 出金合計</div>
              <div className={`${s.summaryValue} ${s.summaryExpense}`}>
                ¥{yearlyData.totals.expense.toLocaleString()}
              </div>
            </div>
            <div className={s.summaryCard}>
              <div className={s.summaryLabel}>年間 収支</div>
              <div
                className={`${s.summaryValue} ${
                  yearlyData.totals.net >= 0 ? s.summaryNetPositive : s.summaryNetNegative
                }`}
              >
                {yearlyData.totals.net >= 0 ? "+" : ""}¥{yearlyData.totals.net.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Yearly breakdown table */}
          <div className={s.tableWrap} style={{ marginBottom: "1.25rem" }}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>月</th>
                  <th className={s.textRight}>入金</th>
                  <th className={s.textRight}>出金</th>
                  <th className={s.textRight}>収支</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.months.map((m) => (
                  <tr
                    key={m.month}
                    style={{ cursor: "pointer" }}
                    onClick={() => { setMonth(m.month); setViewMode("monthly"); }}
                  >
                    <td style={{ fontWeight: 600 }}>{m.month}月</td>
                    <td className={s.textRight} style={{ color: "#059669" }}>
                      ¥{m.income.toLocaleString()}
                    </td>
                    <td className={s.textRight} style={{ color: "#dc2626" }}>
                      ¥{m.expense.toLocaleString()}
                    </td>
                    <td
                      className={s.textRight}
                      style={{
                        fontWeight: 600,
                        color: m.net >= 0 ? "#059669" : "#dc2626",
                      }}
                    >
                      {m.net >= 0 ? "+" : ""}¥{m.net.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                  <td style={{ fontWeight: 700 }}>合計</td>
                  <td className={s.textRight} style={{ fontWeight: 700, color: "#059669" }}>
                    ¥{yearlyData.totals.income.toLocaleString()}
                  </td>
                  <td className={s.textRight} style={{ fontWeight: 700, color: "#dc2626" }}>
                    ¥{yearlyData.totals.expense.toLocaleString()}
                  </td>
                  <td
                    className={s.textRight}
                    style={{
                      fontWeight: 700,
                      color: yearlyData.totals.net >= 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    {yearlyData.totals.net >= 0 ? "+" : ""}¥{yearlyData.totals.net.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Link to customer breakdown page */}
          <Link
            href={`/cashflow/customers?year=${year}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "underline",
              marginBottom: "1.25rem",
            }}
          >
            顧客別 年間収支
            <ChevronRightRoundedIcon style={{ fontSize: 18 }} />
          </Link>
        </>
      )}

      {viewMode === "monthly" && (
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: tab === t ? 600 : 400,
              color:
                tab === t ? "var(--color-primary)" : "var(--color-text-secondary)",
              borderBottom:
                tab === t ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      )}

      {viewMode === "monthly" && tab === "請求書" && (
        <div className={s.tableWrap}>
          {filteredInvoices.length === 0 ? (
            <div className={s.empty}>{formatYearMonth(year, month)}の請求書はありません。</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>請求番号</th>
                  <th>件名</th>
                  <th>発行日</th>
                  <th>支払期限</th>
                  <th className={s.textRight}>合計</th>
                  <th className={s.textRight}>入金済</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.title ?? "—"}</td>
                    <td>{inv.issueDate}</td>
                    <td>{inv.dueDate ?? "—"}</td>
                    <td className={s.textRight}>
                      ¥{Number(inv.totalAmount).toLocaleString()}
                    </td>
                    <td className={s.textRight}>
                      ¥{Number(inv.paidAmount).toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                    <td>
                      <div className={s.actionsCell}>
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          className={s.btnIcon}
                          title="PDF出力"
                          download
                        >
                          <PictureAsPdfRoundedIcon style={{ fontSize: 16 }} />
                        </a>
                        <Link
                          href={`/cashflow/invoices/${inv.id}`}
                          className={s.btnIcon}
                          title="編集"
                        >
                          <EditRoundedIcon style={{ fontSize: 16 }} />
                        </Link>
                        <button
                          className={s.btnIcon}
                          title="削除"
                          onClick={async () => {
                            if (!confirm("この請求書を削除しますか？")) return;
                            await deleteInvoice(inv.id);
                          }}
                        >
                          <DeleteRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}


      {viewMode === "monthly" && tab === "出金・支払い" && (
        <div className={s.tableWrap}>
          {filteredExpenses.length === 0 ? (
            <div className={s.empty}>{formatYearMonth(year, month)}の出金記録はありません。</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>支払先</th>
                  <th>件名</th>
                  <th>区分</th>
                  <th>支払予定日</th>
                  <th className={s.textRight}>予定金額</th>
                  <th>支払日</th>
                  <th className={s.textRight}>実際金額</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.payeeName}</td>
                    <td>{ex.title ?? "—"}</td>
                    <td>{ex.category ?? "—"}</td>
                    <td>{ex.expectedDate ?? "—"}</td>
                    <td className={s.textRight}>
                      {ex.expectedAmount
                        ? `¥${Number(ex.expectedAmount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td>{ex.actualDate ?? "—"}</td>
                    <td className={s.textRight}>
                      {ex.actualAmount
                        ? `¥${Number(ex.actualAmount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge status={ex.paymentStatus} />
                    </td>
                    <td>
                      <div className={s.actionsCell}>
                        <button
                          className={s.btnIcon}
                          onClick={() => openEditExpense(ex)}
                        >
                          <EditRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                        <button
                          className={s.btnIcon}
                          onClick={async () => {
                            if (!confirm("この出金記録を削除しますか？")) return;
                            await deleteExpense(ex.id);
                          }}
                        >
                          <DeleteRoundedIcon style={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showExpenseForm && (
        <div className={s.overlay} onClick={() => setShowExpenseForm(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.modalTitle}>
              {editingExpense ? "出金を編集" : "出金を追加"}
            </h2>
            <form onSubmit={handleExpenseSubmit}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>支払先 *</label>
                  <input
                    className={s.formInput}
                    value={expenseForm.payeeName}
                    onChange={(e) =>
                      setExpenseForm((f) => ({ ...f, payeeName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>区分</label>
                  <select
                    className={s.formSelect}
                    value={expenseForm.category ?? ""}
                    onChange={(e) => setExp("category", e.target.value)}
                  >
                    <option value="">選択してください</option>
                    <option value="仕入">仕入</option>
                    <option value="外注">外注</option>
                    <option value="経費">経費</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>件名</label>
                  <input
                    className={s.formInput}
                    value={expenseForm.title ?? ""}
                    onChange={(e) => setExp("title", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>顧客</label>
                  <select
                    className={s.formSelect}
                    value={expenseForm.customerId ?? ""}
                    onChange={(e) => setExp("customerId", e.target.value)}
                  >
                    <option value="">なし</option>
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
                  <label className={s.formLabel}>支払方法</label>
                  <select
                    className={s.formSelect}
                    value={expenseForm.paymentMethod ?? ""}
                    onChange={(e) => setExp("paymentMethod", e.target.value)}
                  >
                    <option value="">選択してください</option>
                    <option value="振込">振込</option>
                    <option value="現金">現金</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>支払予定日</label>
                  <input
                    className={s.formInput}
                    type="date"
                    value={expenseForm.expectedDate ?? ""}
                    onChange={(e) => setExp("expectedDate", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>予定金額</label>
                  <input
                    className={s.formInput}
                    type="number"
                    value={expenseForm.expectedAmount ?? ""}
                    onChange={(e) => setExp("expectedAmount", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>支払日</label>
                  <input
                    className={s.formInput}
                    type="date"
                    value={expenseForm.actualDate ?? ""}
                    onChange={(e) => setExp("actualDate", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>実際金額</label>
                  <input
                    className={s.formInput}
                    type="number"
                    value={expenseForm.actualAmount ?? ""}
                    onChange={(e) => setExp("actualAmount", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>状態</label>
                  <select
                    className={s.formSelect}
                    value={expenseForm.paymentStatus}
                    onChange={(e) =>
                      setExpenseForm((f) => ({
                        ...f,
                        paymentStatus: e.target.value,
                      }))
                    }
                  >
                    <option value="unpaid">未払い</option>
                    <option value="paid">支払済</option>
                  </select>
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>備考</label>
                  <textarea
                    className={s.formTextarea}
                    value={expenseForm.notes ?? ""}
                    onChange={(e) => setExp("notes", e.target.value)}
                  />
                </div>
              </div>
              <div className={s.formActions}>
                <button type="submit" className={s.btnPrimary} disabled={loading}>
                  {loading ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  className={s.btnSecondary}
                  onClick={() => setShowExpenseForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Type selection modal */}
      {showTypeSelect && (
        <div className={s.overlay} onClick={() => { setShowTypeSelect(false); setPendingFiles([]); }}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 className={s.modalTitle}>請求書の種別を選択</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
              アップロードする請求書の種別を選択してください。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  border: `2px solid ${uploadDocType === "sales" ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="docType"
                  checked={uploadDocType === "sales"}
                  onChange={() => setUploadDocType("sales")}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>売上請求書</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    得意先から受け取る入金に関する請求書
                  </div>
                </div>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  border: `2px solid ${uploadDocType === "purchase" ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="docType"
                  checked={uploadDocType === "purchase"}
                  onChange={() => setUploadDocType("purchase")}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>仕入請求書</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    仕入先への支払いに関する請求書
                  </div>
                </div>
              </label>
            </div>
            <div className={s.formActions} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <button className={s.btnPrimary} onClick={handleUploadWithType}>
                アップロード & AI抽出
              </button>
              <button
                className={s.btnSecondary}
                onClick={() => { setShowTypeSelect(false); setPendingFiles([]); }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extract error display */}
      {extractError && (
        <div className={s.overlay} onClick={() => setExtractError(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 className={s.modalTitle}>抽出エラー</h2>
            <div className={s.formError}>{extractError}</div>
            <div className={s.formActions} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <button className={s.btnSecondary} onClick={() => setExtractError(null)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extraction preview modal */}
      {showExtractPreview && extractedData && (
        <div className={s.overlay} onClick={() => setShowExtractPreview(false)}>
          <div
            className={s.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
          >
            <h2 className={s.modalTitle}>
              AI抽出結果 — {uploadDocType === "sales" ? "売上請求書" : "仕入請求書"}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
              抽出されたデータを確認・修正してから保存してください。
            </p>

            <div className={s.formGrid}>
              <div className={s.formGroupFull}>
                <label className={s.formLabel}>取引先名</label>
                <input
                  className={s.formInput}
                  value={exVendorName}
                  onChange={(e) => setExVendorName(e.target.value)}
                />
              </div>

              {uploadDocType === "sales" && (
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>顧客 *</label>
                  <select
                    className={s.formSelect}
                    value={exCustomerId}
                    onChange={(e) => setExCustomerId(e.target.value)}
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
              )}

              {uploadDocType === "purchase" && (
                <div className={s.formGroup}>
                  <label className={s.formLabel}>区分</label>
                  <select
                    className={s.formSelect}
                    value={exCategory}
                    onChange={(e) => setExCategory(e.target.value)}
                  >
                    <option value="仕入">仕入</option>
                    <option value="外注">外注</option>
                    <option value="経費">経費</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              )}

              <div className={s.formGroup}>
                <label className={s.formLabel}>発行日</label>
                <input
                  className={s.formInput}
                  type="date"
                  value={exIssueDate}
                  onChange={(e) => setExIssueDate(e.target.value)}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>支払期限</label>
                <input
                  className={s.formInput}
                  type="date"
                  value={exDueDate}
                  onChange={(e) => setExDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line items (sales invoice only) */}
            {uploadDocType === "sales" && (
              <div style={{ marginTop: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label className={s.formLabel}>明細</label>
                  <button
                    type="button"
                    className={s.btnSecondary}
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    onClick={addItem}
                  >
                    <AddRoundedIcon style={{ fontSize: 14 }} /> 行追加
                  </button>
                </div>
                <div className={s.tableWrap}>
                  <table className={s.table} style={{ minWidth: 500 }}>
                    <thead>
                      <tr>
                        <th>品名</th>
                        <th style={{ width: 70 }}>数量</th>
                        <th style={{ width: 60 }}>単位</th>
                        <th style={{ width: 100 }}>単価</th>
                        <th style={{ width: 100 }}>金額</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exItems.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              className={s.formInput}
                              style={{ width: "100%", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              value={item.itemName}
                              onChange={(e) => updateItem(i, "itemName", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className={s.formInput}
                              type="number"
                              style={{ width: "100%", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              value={item.quantity}
                              onChange={(e) => updateItem(i, "quantity", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className={s.formInput}
                              style={{ width: "100%", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              value={item.unit}
                              onChange={(e) => updateItem(i, "unit", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className={s.formInput}
                              type="number"
                              style={{ width: "100%", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              value={item.unitPrice}
                              onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontSize: "0.8125rem" }}>
                            ¥{item.amount.toLocaleString()}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={s.btnIcon}
                              onClick={() => removeItem(i)}
                              style={{ width: 24, height: 24 }}
                            >
                              <DeleteRoundedIcon style={{ fontSize: 14 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "var(--color-bg)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8125rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>小計</span>
                <span>¥{exSubtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>消費税</span>
                <span>¥{exTaxAmount.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: "1rem",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                <span>合計</span>
                <span>¥{exTotalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className={s.formActions}>
              <button
                className={s.btnPrimary}
                onClick={handleSaveExtraction}
                disabled={savingExtraction}
              >
                {savingExtraction
                  ? "保存中..."
                  : uploadDocType === "sales"
                    ? "売上請求書として保存"
                    : "仕入請求書として保存"}
              </button>
              <button
                className={s.btnSecondary}
                onClick={() => setShowExtractPreview(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
