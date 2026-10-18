import { db } from "@/infrastructure/db/client";
import { estimates } from "@/infrastructure/db/schema";
import { desc } from "drizzle-orm";
import { EstimatesClient } from "./estimates-client";

export const metadata = { title: "見積もり管理 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function EstimatesPage() {
  const estimateList = await db
    .select()
    .from(estimates)
    .orderBy(desc(estimates.createdAt));

  return <EstimatesClient estimates={estimateList} />;
}
