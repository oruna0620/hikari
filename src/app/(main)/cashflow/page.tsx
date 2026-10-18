import { db } from "@/infrastructure/db/client";
import {
  invoices,
  expenses,
  customers,
} from "@/infrastructure/db/schema";
import { desc, eq } from "drizzle-orm";
import { CashflowClient } from "./cashflow-client";

export const metadata = { title: "入出金管理 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function CashflowPage() {
  const [invoiceList, expenseList, customerList] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select().from(expenses).orderBy(desc(expenses.createdAt)),
    db
      .select()
      .from(customers)
      .where(eq(customers.isDeleted, false)),
  ]);

  return (
    <CashflowClient
      invoices={invoiceList}
      expenses={expenseList}
      customers={customerList}
    />
  );
}
