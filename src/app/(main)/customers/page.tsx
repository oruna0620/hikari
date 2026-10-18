import { getCustomers } from "@/lib/di/container";
import { CustomersClient } from "./customers-client";

export const metadata = { title: "顧客一覧 | 株式会社光" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers.execute();
  return <CustomersClient customers={customers} />;
}
