import { db } from "@/infrastructure/db/client";
import { customers, invoices, expenses } from "@/infrastructure/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CustomerCashflowClient } from "./customer-cashflow-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  const name = customer?.companyName ?? customer?.customerName ?? "顧客";
  return { title: `${name} 年間収支 | 株式会社光` };
}

export default async function CustomerCashflowPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year: yearParam } = await searchParams;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  if (!customer) notFound();

  const [invoiceList, expenseList] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, id))
      .orderBy(sql`COALESCE(due_date, issue_date) DESC`),
    db
      .select()
      .from(expenses)
      .where(eq(expenses.customerId, id))
      .orderBy(sql`COALESCE(actual_date, expected_date) DESC`),
  ]);

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  return (
    <CustomerCashflowClient
      customer={customer}
      invoices={invoiceList}
      expenses={expenseList}
      initialYear={year}
    />
  );
}
