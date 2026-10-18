import { db } from "@/infrastructure/db/client";
import { customers, products, taxSettings } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { LiffEstimateForm } from "./liff-estimate-form";

export const metadata = { title: "見積もり作成 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function LiffEstimatePage() {
  const [customerList, productList, taxList] = await Promise.all([
    db
      .select({
        id: customers.id,
        customerName: customers.customerName,
        companyName: customers.companyName,
      })
      .from(customers)
      .where(eq(customers.isDeleted, false)),
    db
      .select({
        id: products.id,
        name: products.name,
        modelNumber: products.modelNumber,
        unitPrice: products.unitPrice,
        unit: products.unit,
      })
      .from(products)
      .where(eq(products.isDeleted, false)),
    db.select().from(taxSettings).limit(1),
  ]);

  const taxRate = taxList[0]?.taxRate ?? "10.00";

  return (
    <LiffEstimateForm
      customers={customerList}
      products={productList}
      taxRate={taxRate}
    />
  );
}
