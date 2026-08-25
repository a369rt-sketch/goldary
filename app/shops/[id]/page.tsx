import { notFound } from "next/navigation";
import { getShopWithPrices } from "@/app/lib/shops";
import ShopView from "./ShopView";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await getShopWithPrices(id);

  if (!shop) {
    notFound();
  }

  // العرض في مكوّن عميل ليتبع اللغة/الاتجاه المختارَين
  return <ShopView shop={shop} />;
}
