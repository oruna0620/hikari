import { searchProducts } from "@/lib/di/container";
import { ProductsClient } from "./products-client";

export const metadata = { title: "品目一覧 | BUTIKOMI" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await searchProducts.execute();
  return <ProductsClient products={products} />;
}
