import { getInventoryDetail } from "../actions";
import { notFound } from "next/navigation";
import { InventoryDetailClient } from "./inventory-detail-client";

export const metadata = { title: "在庫詳細 | 株式会社光" };
export const dynamic = "force-dynamic";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const data = await getInventoryDetail(productId);

  if (!data) {
    notFound();
  }

  return (
    <InventoryDetailClient
      product={data.product}
      inventory={data.inventory}
      histories={data.histories}
    />
  );
}
