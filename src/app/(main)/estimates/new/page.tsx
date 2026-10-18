import { db } from "@/infrastructure/db/client";
import { customers, products, taxSettings } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { generateEstimateNumber } from "../actions";
import { EstimateForm } from "../estimate-form";

export const metadata = { title: "見積もり作成 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function NewEstimatePage() {
  const [estimateNumber, customerList, productList, taxRows] =
    await Promise.all([
      generateEstimateNumber(),
      db
        .select()
        .from(customers)
        .where(eq(customers.isDeleted, false)),
      db
        .select()
        .from(products)
        .where(eq(products.isDeleted, false)),
      db.select().from(taxSettings).limit(1),
    ]);

  const taxRate = taxRows[0]?.taxRate ?? "10.00";

  return (
    <EstimateForm
      estimateNumber={estimateNumber}
      customers={customerList}
      products={productList}
      taxRate={taxRate}
    />
  );
}
