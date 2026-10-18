"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import s from "../../../../_components/shared.module.css";

type Invoice = {
  id: string;
  invoiceNumber: string;
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
  category: string | null;
  title: string | null;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
  paymentStatus: string;
};

type Customer = {
  id: string;
  customerName: string;
  companyName: string | null;
};

function getYearMonth(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return dateStr.slice(0, 7);
}

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

export function CustomerCashflowClient({
  customer,
  invoices,
  expenses,
  initialYear,
}: {
  customer: Customer;
  invoices: Invoice[];
  expenses: Expense[];
  initialYear: number;
}) {
  const [year, setYear] = useState(initialYear);

  const customerName = customer.companyName
    ? `${customer.companyName} / ${customer.customerName}`
    : customer.customerName;

  const yearPrefix = `${year}-`;

  const yearInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        const ym = getYearMonth(inv.dueDate ?? inv.issueDate);
        return ym?.startsWith(yearPrefix);
      }),
    [invoices, yearPrefix]
  );

  const yearExpenses = useMemo(
    () =>
      expenses.filter((ex) => {
        const ym = getYearMonth(ex.actualDate) ?? getYearMonth(ex.expectedDate);
        return ym?.startsWith(yearPrefix);
      }),
    [expenses, yearPrefix]
  );

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const ym = `${year}-${String(m).padStart(2, "0")}`;

      const mInv = yearInvoices.filter(
        (inv) => getYearMonth(inv.dueDate ?? inv.issueDate) === ym
      );
      const mExp = yearExpenses.filter(
        (ex) =>
          getYearMonth(ex.actualDate) === ym ||
          (!ex.actualDate && getYearMonth(ex.expectedDate) === ym)
      );

      const income = mInv.reduce(
        (sum, inv) =>
          sum +
          (Number(inv.paidAmount) > 0
            ? Number(inv.paidAmount)
            : Number(inv.totalAmount)),
        0
      );
      const expense = mExp.reduce(
        (sum, ex) => sum + Number(ex.actualAmount ?? ex.expectedAmount ?? 0),
        0
      );

      return { month: m, income, expense, net: income - expense };
    });
  }, [yearInvoices, yearExpenses, year]);

  const totals = useMemo(
    () =>
      monthlyData.reduce(
        (acc, m) => ({
          income: acc.income + m.income,
          expense: acc.expense + m.expense,
          net: acc.net + m.net,
        }),
        { income: 0, expense: 0, net: 0 }
      ),
    [monthlyData]
  );

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/cashflow"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <ArrowBackRoundedIcon style={{ fontSize: 16 }} />
          入出金管理に戻る
        </Link>
      </div>

      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>{customerName}</h1>
      </div>

      {/* Year selector */}
      <div className={s.monthSelector}>
        <button className={s.monthBtn} onClick={() => setYear((y) => y - 1)}>
          <ChevronLeftRoundedIcon style={{ fontSize: 20 }} />
        </button>
        <span className={s.monthLabel}>{year}年</span>
        <button className={s.monthBtn} onClick={() => setYear((y) => y + 1)}>
          <ChevronRightRoundedIcon style={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Summary */}
      <div className={s.summaryRow}>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>年間 入金</div>
          <div className={`${s.summaryValue} ${s.summaryIncome}`}>
            ¥{totals.income.toLocaleString()}
          </div>
        </div>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>年間 出金</div>
          <div className={`${s.summaryValue} ${s.summaryExpense}`}>
            ¥{totals.expense.toLocaleString()}
          </div>
        </div>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>年間 収支</div>
          <div
            className={`${s.summaryValue} ${
              totals.net >= 0 ? s.summaryNetPositive : s.summaryNetNegative
            }`}
          >
            {totals.net >= 0 ? "+" : ""}¥{totals.net.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className={s.tableWrap} style={{ marginBottom: "2rem" }}>
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
            {monthlyData.map((m) => (
              <tr key={m.month}>
                <td style={{ fontWeight: 600 }}>{m.month}月</td>
                <td className={s.textRight} style={{ color: m.income > 0 ? "var(--color-positive)" : undefined }}>
                  {m.income > 0 ? `¥${m.income.toLocaleString()}` : "—"}
                </td>
                <td className={s.textRight} style={{ color: m.expense > 0 ? "var(--color-negative)" : undefined }}>
                  {m.expense > 0 ? `¥${m.expense.toLocaleString()}` : "—"}
                </td>
                <td
                  className={s.textRight}
                  style={{
                    fontWeight: 600,
                    color: m.income === 0 && m.expense === 0 ? undefined : m.net >= 0 ? "var(--color-positive)" : "var(--color-negative)",
                  }}
                >
                  {m.income === 0 && m.expense === 0
                    ? "—"
                    : `${m.net >= 0 ? "+" : ""}¥${m.net.toLocaleString()}`}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid var(--color-border)" }}>
              <td style={{ fontWeight: 700 }}>合計</td>
              <td className={s.textRight} style={{ fontWeight: 700, color: "var(--color-positive)" }}>
                ¥{totals.income.toLocaleString()}
              </td>
              <td className={s.textRight} style={{ fontWeight: 700, color: "var(--color-negative)" }}>
                ¥{totals.expense.toLocaleString()}
              </td>
              <td
                className={s.textRight}
                style={{
                  fontWeight: 700,
                  color: totals.net >= 0 ? "var(--color-positive)" : "var(--color-negative)",
                }}
              >
                {totals.net >= 0 ? "+" : ""}¥{totals.net.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Invoice list */}
      {yearInvoices.length > 0 && (
        <>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            請求書一覧
          </h2>
          <div className={s.tableWrap} style={{ marginBottom: "2rem" }}>
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
                </tr>
              </thead>
              <tbody>
                {yearInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link
                        href={`/cashflow/invoices/${inv.id}`}
                        style={{ color: "var(--color-primary)", textDecoration: "underline" }}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.title ?? "—"}</td>
                    <td>{inv.issueDate}</td>
                    <td>{inv.dueDate ?? "—"}</td>
                    <td className={s.textRight}>¥{Number(inv.totalAmount).toLocaleString()}</td>
                    <td className={s.textRight}>¥{Number(inv.paidAmount).toLocaleString()}</td>
                    <td><StatusBadge status={inv.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Expense list */}
      {yearExpenses.length > 0 && (
        <>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            出金一覧
          </h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>件名</th>
                  <th>区分</th>
                  <th>支払予定日</th>
                  <th className={s.textRight}>予定金額</th>
                  <th>支払日</th>
                  <th className={s.textRight}>実際金額</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {yearExpenses.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.title ?? "—"}</td>
                    <td>{ex.category ?? "—"}</td>
                    <td>{ex.expectedDate ?? "—"}</td>
                    <td className={s.textRight}>
                      {ex.expectedAmount ? `¥${Number(ex.expectedAmount).toLocaleString()}` : "—"}
                    </td>
                    <td>{ex.actualDate ?? "—"}</td>
                    <td className={s.textRight}>
                      {ex.actualAmount ? `¥${Number(ex.actualAmount).toLocaleString()}` : "—"}
                    </td>
                    <td><StatusBadge status={ex.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {yearInvoices.length === 0 && yearExpenses.length === 0 && (
        <div className={s.empty}>{year}年の取引データはありません。</div>
      )}
    </>
  );
}
