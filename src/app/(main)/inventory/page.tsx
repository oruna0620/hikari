import { getInventoryList } from "./actions";
import { InventoryClient } from "./inventory-client";

export const metadata = { title: "在庫管理 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventoryList = await getInventoryList();

  return <InventoryClient inventories={inventoryList} />;
}
