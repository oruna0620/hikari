import { db } from "@/infrastructure/db/client";
import { invoices, expenses, customers } from "@/infrastructure/db/schema";
import { desc, eq } from "drizzle-orm";
import { CustomerListClient } from "./customer-list-client";

export const metadata = { title: "顧客別 年間収支 | 株式会社光" };
export const dynamic = "force-dynamic";

export default async function CustomerCashflowListPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const [invoiceList, expenseList, customerList] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select().from(expenses).orderBy(desc(expenses.createdAt)),
    db.select().from(customers).where(eq(customers.isDeleted, false)),
  ]);

  return (
    <CustomerListClient
      invoices={invoiceList}
      expenses={expenseList}
      customers={customerList}
      initialYear={year}
    />
  );
}
