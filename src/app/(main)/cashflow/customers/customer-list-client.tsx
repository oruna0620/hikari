"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import s from "../../../_components/shared.module.css";

type Invoice = {
  id: string;
  customerId: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: string;
  paidAmount: string;
};

type Expense = {
  id: string;
  payeeName: string;
  customerId: string | null;
  expectedDate: string | null;
  expectedAmount: string | null;
  actualDate: string | null;
  actualAmount: string | null;
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

export function CustomerListClient({
  invoices,
  expenses,
  customers,
  initialYear,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  customers: Customer[];
  initialYear: number;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const yearPrefix = `${year}-`;

  const data = useMemo(() => {
    const map = new Map<string, { name: string; income: number; expense: number }>();

    for (const inv of invoices) {
      const ym = getYearMonth(inv.dueDate ?? inv.issueDate);
      if (!ym || !ym.startsWith(yearPrefix)) continue;
      const cid = inv.customerId;
      const c = customers.find((c) => c.id === cid);
      const label = c
        ? c.companyName
          ? `${c.companyName} / ${c.customerName}`
          : c.customerName
        : "不明";
      const entry = map.get(cid) ?? { name: label, income: 0, expense: 0 };
      entry.income +=
        Number(inv.paidAmount) > 0
          ? Number(inv.paidAmount)
          : Number(inv.totalAmount);
      map.set(cid, entry);
    }

    for (const ex of expenses) {
      const ym = getYearMonth(ex.actualDate) ?? getYearMonth(ex.expectedDate);
      if (!ym || !ym.startsWith(yearPrefix)) continue;
      const key = ex.customerId ?? `payee:${ex.payeeName}`;
      const label = ex.customerId
        ? (() => {
            const c = customers.find((c) => c.id === ex.customerId);
            return c
              ? c.companyName
                ? `${c.companyName} / ${c.customerName}`
                : c.customerName
              : ex.payeeName;
          })()
        : ex.payeeName;
      const entry = map.get(key) ?? { name: label, income: 0, expense: 0 };
      entry.expense += Number(ex.actualAmount ?? ex.expectedAmount ?? 0);
      map.set(key, entry);
    }

    return Array.from(map.entries())
      .map(([id, d]) => ({ id, ...d, net: d.income - d.expense }))
      .sort((a, b) => b.income + b.expense - (a.income + a.expense));
  }, [invoices, expenses, customers, yearPrefix]);

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, c) => ({
          income: acc.income + c.income,
          expense: acc.expense + c.expense,
          net: acc.net + c.net,
        }),
        { income: 0, expense: 0, net: 0 }
      ),
    [data]
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
        <h1 className={s.pageTitle}>顧客別 年間収支</h1>
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
          <div className={s.summaryLabel}>年間 入金合計</div>
          <div className={`${s.summaryValue} ${s.summaryIncome}`}>
            ¥{totals.income.toLocaleString()}
          </div>
        </div>
        <div className={s.summaryCard}>
          <div className={s.summaryLabel}>年間 出金合計</div>
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

      {/* Customer table */}
      {data.length === 0 ? (
        <div className={s.empty}>{year}年の取引データはありません。</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>顧客・取引先</th>
                <th className={s.textRight}>入金</th>
                <th className={s.textRight}>出金</th>
                <th className={s.textRight}>収支</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => {
                const isCustomer = !c.id.startsWith("payee:");
                return (
                  <tr
                    key={c.id}
                    style={{ cursor: isCustomer ? "pointer" : undefined }}
                    onClick={
                      isCustomer
                        ? () => router.push(`/cashflow/customers/${c.id}?year=${year}`)
                        : undefined
                    }
                  >
                    <td style={{ fontWeight: 600 }}>
                      {isCustomer ? (
                        <span style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
                          {c.name}
                        </span>
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className={s.textRight} style={{ color: c.income > 0 ? "#059669" : undefined }}>
                      {c.income > 0 ? `¥${c.income.toLocaleString()}` : "—"}
                    </td>
                    <td className={s.textRight} style={{ color: c.expense > 0 ? "#dc2626" : undefined }}>
                      {c.expense > 0 ? `¥${c.expense.toLocaleString()}` : "—"}
                    </td>
                    <td
                      className={s.textRight}
                      style={{
                        fontWeight: 600,
                        color: c.net >= 0 ? "#059669" : "#dc2626",
                      }}
                    >
                      {c.net >= 0 ? "+" : ""}¥{c.net.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                <td style={{ fontWeight: 700 }}>合計</td>
                <td className={s.textRight} style={{ fontWeight: 700, color: "#059669" }}>
                  ¥{totals.income.toLocaleString()}
                </td>
                <td className={s.textRight} style={{ fontWeight: 700, color: "#dc2626" }}>
                  ¥{totals.expense.toLocaleString()}
                </td>
                <td
                  className={s.textRight}
                  style={{
                    fontWeight: 700,
                    color: totals.net >= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {totals.net >= 0 ? "+" : ""}¥{totals.net.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
